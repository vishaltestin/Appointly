import "server-only"
import { db } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import type { OrgRole } from "@/generated/prisma/client"

interface BootstrapParams {
  userId: string
  email: string
  name: string | null
  /**
   * When registration originated from a specific invite link, pass its token
   * so we honor *that* invite precisely (important if the same email has
   * multiple pending invites across different orgs — we don't want to
   * silently join all of them just because one link was clicked).
   *
   * When omitted (e.g. first-time Google sign-in has no reliable way to
   * carry a token through the OAuth redirect), we fall back to auto-joining
   * any pending invitation(s) that match the account's email.
   */
  preferredInvitationToken?: string
}

/**
 * Ensures every newly created user ends up in at least one workspace.
 * Called once, immediately after user creation, from:
 *  - the credentials registration server action
 *  - the `createUser` adapter event (first-time OAuth sign-in)
 *
 * Rule: if the user was invited somewhere, join that — never also create a
 * personal workspace alongside it. A personal workspace is only bootstrapped
 * when there's no invitation to honor.
 */
export async function bootstrapNewUserWorkspace({
  userId,
  email,
  name,
  preferredInvitationToken,
}: BootstrapParams) {
  let invitationsToJoin: {
    id: string
    organizationId: string
    role: OrgRole
  }[] = []

  if (preferredInvitationToken) {
    const invitation = await db.invitation.findUnique({
      where: { token: preferredInvitationToken },
    })
    const isValid =
      invitation &&
      invitation.status === "PENDING" &&
      invitation.expiresAt > new Date() &&
      invitation.email.toLowerCase() === email.toLowerCase()
    if (isValid) invitationsToJoin = [invitation]
  } else {
    invitationsToJoin = await db.invitation.findMany({
      where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
    })
  }

  if (invitationsToJoin.length > 0) {
    await db.$transaction(async (tx) => {
      for (const invitation of invitationsToJoin) {
        await tx.membership.create({
          data: {
            userId,
            organizationId: invitation.organizationId,
            role: invitation.role,
          },
        })
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        })
      }
      await tx.user.update({
        where: { id: userId },
        data: { lastActiveOrgId: invitationsToJoin[0].organizationId },
      })
    })
    return { joinedViaInvitation: true }
  }

  const orgSlug = await generateUniqueOrgSlug(name ?? email.split("@")[0])
  await db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: name ? `${name}'s Workspace` : "My Workspace",
        slug: orgSlug,
      },
    })
    await tx.membership.create({
      data: { userId, organizationId: organization.id, role: "OWNER" },
    })
    await tx.user.update({
      where: { id: userId },
      data: { lastActiveOrgId: organization.id },
    })
  })

  return { joinedViaInvitation: false }
}

async function generateUniqueOrgSlug(name: string) {
  const base = generateSlug(name) || "workspace"
  let slug = base
  let suffix = 1
  while (await db.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`
  }
  return slug
}
