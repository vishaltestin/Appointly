"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { requireAuth, requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import { canAddTeamMember } from "@/lib/usage"
import { sendInvitationEmail } from "@/lib/mail"
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
} from "@/lib/validations/member.schema"

const INVITATION_EXPIRY_DAYS = 7

export async function inviteMember(orgSlug: string, values: InviteMemberInput) {
  const membership = await requireOrgMembership(orgSlug)
  if (!permissions.canInviteMembers(membership.role)) {
    return { error: "You don't have permission to invite members." }
  }

  const parsed = inviteMemberSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid invitation details." }
  const { email, role } = parsed.data

  const existingMember = await db.membership.findFirst({
    where: { organizationId: membership.organizationId, user: { email } },
  })
  if (existingMember) return { error: "This person is already a member." }

  const existingInvite = await db.invitation.findFirst({
    where: {
      organizationId: membership.organizationId,
      email,
      status: "PENDING",
    },
  })
  if (existingInvite)
    return { error: "An invitation is already pending for this email." }

  // Plan gate (Module 8). Checked after the duplicate guards so re-inviting
  // an existing member reports the real problem instead of a seat error.
  const limitCheck = await canAddTeamMember(membership.organizationId)
  if (!limitCheck.allowed) return { error: limitCheck.error! }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  )

  await db.invitation.create({
    data: {
      email,
      role,
      token,
      organizationId: membership.organizationId,
      invitedById: membership.userId,
      expiresAt,
    },
  })

  await sendInvitationEmail({
    to: email,
    orgName: membership.organization.name,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
    inviterName: membership.user.name ?? "A teammate",
  })

  revalidatePath(`/app/${orgSlug}/settings/members`)
  return { success: `Invitation sent to ${email}.` }
}

export async function revokeInvitation(orgSlug: string, invitationId: string) {
  const membership = await requireOrgMembership(orgSlug)
  if (!permissions.canInviteMembers(membership.role)) {
    return { error: "You don't have permission to manage invitations." }
  }

  await db.invitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
  })

  revalidatePath(`/app/${orgSlug}/settings/members`)
  return { success: "Invitation revoked." }
}

export async function acceptInvitation(token: string) {
  const user = await requireAuth()

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: true },
  })

  if (!invitation || invitation.status !== "PENDING") {
    return { error: "This invitation is invalid or has already been used." }
  }
  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    })
    return { error: "This invitation has expired." }
  }
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return { error: "This invitation was sent to a different email address." }
  }

  const alreadyMember = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id!,
        organizationId: invitation.organizationId,
      },
    },
  })

  if (!alreadyMember) {
    await db.$transaction([
      db.membership.create({
        data: {
          userId: user.id!,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      }),
      db.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
      db.user.update({
        where: { id: user.id! },
        data: { lastActiveOrgId: invitation.organizationId },
      }),
    ])
  }

  redirect(`/app/${invitation.organization.slug}/dashboard`)
}

export async function removeMember(orgSlug: string, membershipId: string) {
  const membership = await requireOrgMembership(orgSlug)
  if (!permissions.canRemoveMember(membership.role)) {
    return { error: "You don't have permission to remove members." }
  }

  const target = await db.membership.findUnique({ where: { id: membershipId } })
  if (!target || target.organizationId !== membership.organizationId) {
    return { error: "Member not found." }
  }
  if (target.role === "OWNER")
    return { error: "The workspace owner cannot be removed." }
  if (target.id === membership.id) {
    return {
      error: "You can't remove yourself. Use 'Leave workspace' instead.",
    }
  }

  await db.membership.delete({ where: { id: membershipId } })
  revalidatePath(`/app/${orgSlug}/settings/members`)
  return { success: "Member removed." }
}

export async function updateMemberRole(
  orgSlug: string,
  values: UpdateMemberRoleInput
) {
  const membership = await requireOrgMembership(orgSlug)
  if (!permissions.canChangeRoles(membership.role)) {
    return { error: "Only the owner can change member roles." }
  }

  const parsed = updateMemberRoleSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid role." }

  const target = await db.membership.findUnique({
    where: { id: parsed.data.membershipId },
  })
  if (!target || target.organizationId !== membership.organizationId) {
    return { error: "Member not found." }
  }
  if (target.role === "OWNER")
    return { error: "Ownership must be transferred separately." }

  await db.membership.update({
    where: { id: parsed.data.membershipId },
    data: { role: parsed.data.role },
  })

  revalidatePath(`/app/${orgSlug}/settings/members`)
  return { success: "Role updated." }
}

export async function leaveOrganization(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)
  if (membership.role === "OWNER") {
    return { error: "Transfer ownership before leaving this workspace." }
  }

  await db.membership.delete({ where: { id: membership.id } })
  redirect("/app")
}
