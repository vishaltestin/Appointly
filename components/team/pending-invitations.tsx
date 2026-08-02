"use client"

import { useTransition } from "react"
import { Mail, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/shared/role-badge"
import { revokeInvitation } from "@/actions/member.actions"
import type { OrgRole } from "@/generated/prisma/client"

interface Invitation {
  id: string
  email: string
  role: OrgRole
  createdAt: Date
}

export function PendingInvitations({
  orgSlug,
  invitations,
}: {
  orgSlug: string
  invitations: Invitation[]
}) {
  const [isPending, startTransition] = useTransition()

  if (invitations.length === 0) return null

  function handleRevoke(id: string) {
    startTransition(async () => {
      await revokeInvitation(orgSlug, id)
    })
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Pending invitations
      </h3>
      <div className="divide-y rounded-lg border">
        {invitations.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">
                  Invited{" "}
                  {formatDistanceToNow(invite.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RoleBadge role={invite.role} />
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleRevoke(invite.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
