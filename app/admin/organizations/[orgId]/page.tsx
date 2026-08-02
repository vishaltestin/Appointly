import { notFound } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { db } from "@/lib/db"
import { StatusBadge } from "@/components/shared/status-badge"
import { RoleBadge } from "@/components/shared/role-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { SuspendOrgDialog } from "@/components/admin/suspend-org-dialog"
import { DeleteOrgDialog } from "@/components/admin/delete-org-dialog"

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  const organization = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  })

  if (!organization) notFound()

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {organization.name}
            </h1>
            <StatusBadge status={organization.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            /{organization.slug} · Created{" "}
            {formatDistanceToNow(organization.createdAt, { addSuffix: true })} ·
            Timezone: {organization.timezone}
          </p>
        </div>
        <div className="flex gap-2">
          <SuspendOrgDialog
            orgId={organization.id}
            orgName={organization.name}
            status={organization.status}
          />
          <DeleteOrgDialog
            orgId={organization.id}
            orgName={organization.name}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">
            Members ({organization.memberships.length})
          </h2>
        </div>
        <div className="divide-y">
          {organization.memberships.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.user.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(m.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.user.email}
                  </p>
                </div>
              </div>
              <RoleBadge role={m.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
