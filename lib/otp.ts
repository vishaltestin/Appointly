import "server-only"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import type { PendingRegistration } from "@/generated/prisma/client"

/**
 * Signup phone-OTP state, stored on `pending_registrations`.
 *
 * The account does NOT exist until the OTP verifies — registration only
 * creates a PendingRegistration row holding everything needed to finish
 * signup (name, email, phone, hashed password, invite token). One row per
 * email; a new request for the same email replaces the previous state.
 * Codes are 6 digits, bcrypt-hashed at rest, valid for 10 minutes, and
 * limited to 5 verify attempts before a fresh code is required.
 */

// Internal tuning constants. The client-visible copy of the resend cooldown
// lives in lib/otp-ui.ts (client-safe) — keep the two in sync.
const OTP_TTL_MINUTES = 10
const OTP_MAX_ATTEMPTS = 5
const OTP_RESEND_COOLDOWN_SECONDS = 60

export function generateOtpCode(): string {
  // 6 digits, cryptographically random, no modulo bias concerns here
  const buf = crypto.getRandomValues(new Uint32Array(1))
  return String(buf[0] % 1_000_000).padStart(6, "0")
}

export async function getPendingRegistration(email: string) {
  return db.pendingRegistration.findUnique({ where: { email } })
}

export async function hashOtpCode(code: string): Promise<string> {
  // Cheap cost factor: codes are short-lived and attempt-limited.
  return bcrypt.hash(code, 6)
}

/** Replace any previous pending signup for this email with fresh OTP state. */
export async function upsertPendingRegistration(params: {
  email: string
  name: string
  phone: string
  passwordHash: string
  codeHash: string
  invitationToken?: string
}) {
  const { codeHash, email, name, phone, passwordHash, invitationToken } = params
  const fresh = {
    name,
    phone,
    passwordHash,
    codeHash,
    invitationToken: invitationToken ?? null,
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    lastSentAt: new Date(),
  }
  await db.pendingRegistration.upsert({
    where: { email },
    create: { email, ...fresh },
    update: fresh,
  })
}

/** Store a freshly-sent replacement code on an existing pending signup. */
export async function refreshPendingCode(
  id: string,
  codeHash: string
): Promise<void> {
  await db.pendingRegistration.update({
    where: { id },
    data: {
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      lastSentAt: new Date(),
    },
  })
}

export type VerifyPendingResult =
  | { ok: true; pending: PendingRegistration }
  | { ok: false; error: string; exhausted?: boolean }

/**
 * Checks the code against the pending signup's hash. On success the row is
 * intentionally left in place — the caller deletes it in the same
 * transaction that creates the user, so a failed user-creation can never
 * strand a verified-but-accountless signup.
 */
export async function verifyPendingCode(
  email: string,
  code: string
): Promise<VerifyPendingResult> {
  const pending = await getPendingRegistration(email)
  if (!pending)
    return {
      ok: false,
      error: "No pending signup found for this email. Please register again.",
    }
  if (pending.expiresAt < new Date())
    return {
      ok: false,
      error: "That code has expired. Please request a new one.",
    }
  if (pending.attempts >= OTP_MAX_ATTEMPTS)
    return {
      ok: false,
      error: "Too many wrong attempts. Please request a new code.",
      exhausted: true,
    }

  const matches = await bcrypt.compare(code, pending.codeHash)
  if (!matches) {
    const remaining = OTP_MAX_ATTEMPTS - (pending.attempts + 1)
    await db.pendingRegistration.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    })
    return {
      ok: false,
      error:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
          : "Too many wrong attempts. Please request a new code.",
      exhausted: remaining <= 0,
    }
  }

  return { ok: true, pending }
}

/** Seconds until a resend is allowed again (0 = allowed now). */
export function resendCooldownSeconds(lastSentAt: Date): number {
  const elapsed = (Date.now() - lastSentAt.getTime()) / 1000
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed))
}
