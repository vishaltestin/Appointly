"use server"

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { bootstrapNewUserWorkspace } from "@/lib/workspace-bootstrap"
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth.schema"

export async function registerUser(
  values: RegisterInput,
  invitationToken?: string
) {
  const parsed = registerSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid fields provided." }

  const { name, email, password } = parsed.data

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
    data: { name, email, password: hashedPassword },
  })

  const { joinedViaInvitation } = await bootstrapNewUserWorkspace({
    userId: user.id,
    email,
    name,
    preferredInvitationToken: invitationToken,
  })

  return {
    success: joinedViaInvitation
      ? "Account created. You've joined the workspace."
      : "Account created. You can now sign in.",
  }
}
