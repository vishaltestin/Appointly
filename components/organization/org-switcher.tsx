"use client"

import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import type { OrgRole } from "@/generated/prisma/client"

interface SidebarOrg {
  id: string
  name: string
  slug: string
  logo: string | null
  role: OrgRole
}

export function OrgSwitcher({
  organizations,
  currentSlug,
}: {
  organizations: SidebarOrg[]
  currentSlug: string
}) {
  const router = useRouter()
  const current = organizations.find((o) => o.slug === currentSlug)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-muted">
        <span className="flex items-center gap-2 overflow-hidden">
          <Avatar className="h-7 w-7 rounded-md">
            <AvatarImage src={current?.logo ?? undefined} />
            <AvatarFallback className="rounded-md text-xs">
              {getInitials(current?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">{current?.name}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="flex items-center justify-between"
            onClick={() => router.push(`/app/${org.slug}/dashboard`)}
          >
            <span className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-6 w-6 rounded-md">
                <AvatarImage src={org.logo ?? undefined} />
                <AvatarFallback className="rounded-md text-[10px]">
                  {getInitials(org.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{org.name}</span>
            </span>
            {org.slug === currentSlug && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/app/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
