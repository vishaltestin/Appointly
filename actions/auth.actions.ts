"use server"

import bcrypt from "bcryptjs"
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
  createOtpChallenge,
  generateOtpCode,
  verifyOtpCode,
  resendCooldownSeconds,
} from "@/lib/otp"
import { sendOtpWhatsApp } from "@/lib/whatsapp"

export type RegisterResult =
  | { error: string; invalidInvite?: boolean }
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

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await db.user.create({
    data: { name, email, password: hashedPassword, phone },
  })

  // Send first, store the challenge only once delivery succeeded — otherwise
  // a failed send would burn the signup and lock the email address.
  const code = generateOtpCode()
  const sent = await sendOtpWhatsApp(phone, code)
  if (!sent.ok) {
    await db.user.delete({ where: { id: user.id } })
    return { error: sent.error }
  }
  await createOtpChallenge(user.id, phone, code)

  const { joinedViaInvitation } = await bootstrapNewUserWorkspace({
    userId: user.id,
    email,
    name,
    preferredInvitationToken: invitationToken,
  })

  return {
    success: joinedViaInvitation
      ? "Account created. You've joined the workspace."
      : "Account created.",
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
  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { error: "No account found for this email." }
  if (user.phoneVerifiedAt)
    return { success: "Your number is already verified. You can sign in." }

  const result = await verifyOtpCode(user.id, parsed.data.code)
  if (!result.ok) return { error: result.error, exhausted: result.exhausted }

  await db.user.update({
    where: { id: user.id },
    data: { phoneVerifiedAt: new Date() },
  })
  return { success: "Mobile number verified. You can sign in now." }
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
  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { error: "No account found for this email." }
  if (user.phoneVerifiedAt) return { error: "This number is already verified." }
  if (!user.phone) return { error: "No mobile number on file for this account." }

  const cooldown = await resendCooldownSeconds(user.id)
  if (cooldown > 0)
    return {
      error: `Please wait ${cooldown}s before requesting a new code.`,
      cooldownSeconds: cooldown,
    }

  const code = generateOtpCode()
  const sent = await sendOtpWhatsApp(user.phone, code)
  if (!sent.ok) return { error: sent.error }
  await createOtpChallenge(user.id, user.phone, code)

  return {
    success: "A new code is on its way to your WhatsApp.",
    ...(sent.dev ? { devOtp: code } : {}),
  }
}
