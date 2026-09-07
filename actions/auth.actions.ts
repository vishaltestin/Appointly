"use server"

import bcrypt from "bcryptjs"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { bootstrapNewUserWorkspace } from "@/lib/workspace-bootstrap"
import {
  registerSchema,
  verifyPhoneOtpSchema,
  type RegisterInput,
  type VerifyPhoneOtpInput,
} from "@/lib/validations/auth.schema"
import { normalizePhone, maskPhone } from "@/lib/phone"
import {
  generateOtpCode,
  hashOtpCode,
  getPendingRegistration,
  upsertPendingRegistration,
  refreshPendingCode,
  verifyPendingCode,
  resendCooldownSeconds,
} from "@/lib/otp"
import { sendOtpWhatsApp } from "@/lib/whatsapp"

export type RegisterResult =
  | {
      error: string
      invalidInvite?: boolean
      /** A code was sent moments ago — the UI should jump straight to the
       * OTP step instead of resending (60 s cooldown still active). */
      otpPending?: { email: string; maskedPhone: string }
    }
  | {
      success: string
      otpRequired: true
      email: string
      maskedPhone: string
      /** Only present when ALLOW_DEV_OTP=true (no WACRM creds configured). */
      devOtp?: string
    }

export async function registerUser(
  values: RegisterInput,
  invitationToken?: string
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid fields provided." }

  const { name, email, password } = parsed.data
  const phone = normalizePhone(parsed.data.phone)
  if (!phone) return { error: "Enter a valid mobile number." }

  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser)
    return { error: "An account with this email already exists." }

  // If they arrived via an invite link, that specific invite must still be
  // valid — we don't want to silently fall back to a personal workspace
  // without telling them why.
  if (invitationToken) {
    const invitation = await db.invitation.findUnique({
      where: { token: invitationToken },
    })
    const isValid =
      invitation &&
      invitation.status === "PENDING" &&
      invitation.expiresAt > new Date() &&
      invitation.email.toLowerCase() === email.toLowerCase()

    if (!isValid) {
      return {
        error:
          "This invitation link is invalid, expired, or was sent to a different email address.",
        invalidInvite: true,
      }
    }
  }

  // A code was literally just sent for this email — don't spam WhatsApp on
  // every resubmit; point the UI at the OTP step (a resend is available
  // there once the cooldown lapses).
  const existingPending = await getPendingRegistration(email)
  if (existingPending) {
    const cooldown = resendCooldownSeconds(existingPending.lastSentAt)
    if (cooldown > 0) {
      return {
        error: `We already sent a verification code to ${maskPhone(existingPending.phone)}. You can request a new one in ${cooldown}s.`,
        otpPending: {
          email,
          maskedPhone: maskPhone(existingPending.phone),
        },
      }
    }
  }

  // Nothing is stored before delivery succeeds: no user row, no pending
  // row — a failed send can never burn or lock out the email address.
  const code = generateOtpCode()
  const sent = await sendOtpWhatsApp(phone, code)
  if (!sent.ok) return { error: sent.error }

  const [passwordHash, codeHash] = await Promise.all([
    bcrypt.hash(password, 10),
    hashOtpCode(code),
  ])
  await upsertPendingRegistration({
    email,
    name,
    phone,
    passwordHash,
    codeHash,
    invitationToken,
  })

  return {
    success: "Verification code sent.",
    otpRequired: true,
    email,
    maskedPhone: maskPhone(phone),
    ...(sent.dev ? { devOtp: code } : {}),
  }
}

export type VerifyPhoneResult = {
  error?: string
  success?: string
  exhausted?: boolean
}

export async function verifyPhoneOtp(
  values: VerifyPhoneOtpInput
): Promise<VerifyPhoneResult> {
  const parsed = verifyPhoneOtpSchema.safeParse(values)
  if (!parsed.success) return { error: "Enter the 6-digit code." }

  const email = parsed.data.email.toLowerCase()

  // Idempotent: if the account already exists (double-submit, or verified
  // in another tab), just point them at sign-in.
  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existingUser)
    return { success: "Your account is already verified. You can sign in." }

  const result = await verifyPendingCode(email, parsed.data.code)
  if (!result.ok) return { error: result.error, exhausted: result.exhausted }

  const { pending } = result
  let userId: string
  try {
    userId = await db.$transaction(async (tx) => {
      // The account is born here — verified from its first moment.
      const user = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          password: pending.passwordHash,
          phone: pending.phone,
          phoneVerifiedAt: new Date(),
        },
      })
      await tx.pendingRegistration.delete({ where: { id: pending.id } })
      return user.id
    })
  } catch (err) {
    // Someone else verified this email concurrently and won the race.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      await db.pendingRegistration
        .delete({ where: { id: pending.id } })
        .catch(() => {})
      return { success: "Your account is already verified. You can sign in." }
    }
    throw err
  }

  await bootstrapNewUserWorkspace({
    userId,
    email: pending.email,
    name: pending.name,
    preferredInvitationToken: pending.invitationToken ?? undefined,
  })

  return { success: "Mobile number verified — your account is ready. You can sign in now." }
}

export type ResendOtpResult = {
  error?: string
  success?: string
  devOtp?: string
  cooldownSeconds?: number
}

export async function resendPhoneOtp(
  emailRaw: string
): Promise<ResendOtpResult> {
  const email = emailRaw.trim().toLowerCase()

  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existingUser)
    return { error: "This account is already verified. You can sign in." }

  const pending = await getPendingRegistration(email)
  if (!pending)
    return {
      error: "No pending signup found for this email. Please register first.",
    }

  const cooldown = resendCooldownSeconds(pending.lastSentAt)
  if (cooldown > 0)
    return {
      error: `Please wait ${cooldown}s before requesting a new code.`,
      cooldownSeconds: cooldown,
    }

  const code = generateOtpCode()
  const sent = await sendOtpWhatsApp(pending.phone, code)
  if (!sent.ok) return { error: sent.error }
  await refreshPendingCode(pending.id, await hashOtpCode(code))

  return {
    success: "A new code is on its way to your WhatsApp.",
    ...(sent.dev ? { devOtp: code } : {}),
  }
}
