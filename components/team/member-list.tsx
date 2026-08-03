"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/shared/role-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/utils"
import { removeMember, updateMemberRole } from "@/actions/member.actions"
import type { OrgRole } from "@/generated/prisma/client"

interface MemberRow {
  membershipId: string
  userId: string
  name: string | null
  email: string
  image: string | null
  role: OrgRole
}

interface MemberListProps {
  orgSlug: string
  members: MemberRow[]
  currentUserId: string
  currentRole: OrgRole
}

export function MemberList({
  orgSlug,
  members,
  currentUserId,
  currentRole,
}: MemberListProps) {
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const canManage = currentRole === "OWNER" || currentRole === "ADMIN"
  const canChangeRole = currentRole === "OWNER"

  function handleRemove(membershipId: string) {
    setPendingId(membershipId)
    startTransition(async () => {
      await removeMember(orgSlug, membershipId)
      setPendingId(null)
    })
  }

  function handleRoleChange(membershipId: string, role: "ADMIN" | "MEMBER") {
    setPendingId(membershipId)
    startTransition(async () => {
      await updateMemberRole(orgSlug, { membershipId, role })
      setPendingId(null)
    })
  }

  return (
    <div className="divide-y rounded-lg border">
      {members.map((member) => (
        <div
          key={member.membershipId}
          className="flex items-center justify-between gap-4 p-4"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={member.image ?? undefined} />
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {member.name}
                {member.userId === currentUserId && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    (you)
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RoleBadge role={member.role} />
            {canManage &&
              member.role !== "OWNER" &&
              member.userId !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                    disabled={isPending && pendingId === member.membershipId}
                  >
                    {isPending && pendingId === member.membershipId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    {canChangeRole && member.role !== "ADMIN" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleRoleChange(member.membershipId, "ADMIN")
                        }
                      >
                        Make admin
                      </DropdownMenuItem>
                    )}

                    {canChangeRole && member.role !== "MEMBER" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleRoleChange(member.membershipId, "MEMBER")
                        }
                      >
                        Make member
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleRemove(member.membershipId)}
                    >
                      Remove from workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>
      ))}
    </div>
  )
}
