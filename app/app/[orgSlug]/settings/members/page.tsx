import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import { canAddTeamMember } from "@/lib/usage"
import { MemberList } from "@/components/team/member-list"
import { UpgradeNotice } from "@/components/billing/upgrade-notice"
import { PendingInvitations } from "@/components/team/pending-invitations"
import { InviteMemberDialog } from "@/components/team/invite-member-dialog"

export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)
  const canInvite = permissions.canInviteMembers(membership.role)

  const [members, invitations, seatCheck] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { organizationId: membership.organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    canAddTeamMember(membership.organizationId),
  ])

  const memberRows = members.map((m) => ({
    membershipId: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    role: m.role,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Team members</h2>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 && "s"} in this
            workspace
          </p>
        </div>
        {canInvite && (
          <InviteMemberDialog orgSlug={orgSlug} disabled={!seatCheck.allowed} />
        )}
      </div>

      {canInvite && !seatCheck.allowed && (
        <UpgradeNotice orgSlug={orgSlug} message={seatCheck.error!} />
      )}

      <MemberList
        orgSlug={orgSlug}
        members={memberRows}
        currentUserId={membership.userId}
        currentRole={membership.role}
      />

      <PendingInvitations orgSlug={orgSlug} invitations={invitations} />
    </div>
  )
}
