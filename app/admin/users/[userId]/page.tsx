import { notFound } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/session"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/status-badge"
import { RoleBadge } from "@/components/shared/role-badge"
import { SuspendUserDialog } from "@/components/admin/suspend-user-dialog"
import { ChangeRoleDialog } from "@/components/admin/change-role-dialog"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const admin = await requireSuperAdmin()

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { organization: true } } },
  })

  if (!user) notFound()
  const isSelf = admin.id === user.id

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{user.name}</h1>
              <StatusBadge status={user.status} />
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
        {!isSelf && (
          <div className="flex gap-2">
            <ChangeRoleDialog
              userId={user.id}
              userName={user.name ?? user.email}
              currentRole={user.globalRole}
            />
            <SuspendUserDialog
              userId={user.id}
              userName={user.name ?? user.email}
              status={user.status}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">
            Workspaces ({user.memberships.length})
          </h2>
        </div>
        <div className="divide-y">
          {user.memberships.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Not a member of any workspace.
            </p>
          )}
          {user.memberships.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{m.organization.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{m.organization.slug}
                </p>
              </div>
              <RoleBadge role={m.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
