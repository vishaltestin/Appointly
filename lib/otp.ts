import "server-only"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

/**
 * Signup phone-OTP challenges.
 *
 * One active challenge per user (a new request replaces the old one).
 * Codes are 6 digits, bcrypt-hashed at rest, valid for 10 minutes, and
 * limited to 5 verify attempts before a fresh code is required.
 */

export const OTP_TTL_MINUTES = 10
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 60

export function generateOtpCode(): string {
  // 6 digits, cryptographically random, no modulo bias concerns here
  const buf = crypto.getRandomValues(new Uint32Array(1))
  return String(buf[0] % 1_000_000).padStart(6, "0")
}

export async function createOtpChallenge(
  userId: string,
  phone: string,
  code: string
) {
  const codeHash = await bcrypt.hash(code, 6) // cheap: codes are short-lived
  await db.$transaction([
    db.otpChallenge.deleteMany({ where: { userId } }),
    db.otpChallenge.create({
      data: {
        userId,
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    }),
  ])
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; error: string; exhausted?: boolean }

export async function verifyOtpCode(
  userId: string,
  code: string
): Promise<VerifyOtpResult> {
  const challenge = await db.otpChallenge.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  })
  if (!challenge)
    return { ok: false, error: "No verification code was requested. Please request a new one." }
  if (challenge.expiresAt < new Date()) {
    await db.otpChallenge.delete({ where: { id: challenge.id } })
    return { ok: false, error: "That code has expired. Please request a new one.", exhausted: true }
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await db.otpChallenge.delete({ where: { id: challenge.id } })
    return {
      ok: false,
      error: "Too many wrong attempts. Please request a new code.",
      exhausted: true,
    }
  }

  const matches = await bcrypt.compare(code, challenge.codeHash)
  if (!matches) {
    const remaining = OTP_MAX_ATTEMPTS - (challenge.attempts + 1)
    await db.otpChallenge.update({
      where: { id: challenge.id },
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

  await db.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  })
  return { ok: true }
}

/** Seconds until a resend is allowed again (0 = allowed now). */
export async function resendCooldownSeconds(userId: string): Promise<number> {
  const latest = await db.otpChallenge.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })
  if (!latest) return 0
  const elapsed = (Date.now() - latest.createdAt.getTime()) / 1000
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed))
}
