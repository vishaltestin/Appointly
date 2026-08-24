"use client"

import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/shared/role-badge"
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
  const { isMobile } = useSidebar()
  const current = organizations.find((o) => o.slug === currentSlug)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
          />
        }
      >
        <Avatar className="size-8 rounded-lg">
          <AvatarImage src={current?.logo ?? undefined} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary dark:bg-primary/20">
            {getInitials(current?.name)}
          </AvatarFallback>
        </Avatar>
        <span className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{current?.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {current?.role === "OWNER"
              ? "Owner"
              : current?.role === "ADMIN"
                ? "Admin"
                : "Member"}
          </span>
        </span>
        <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
        className="w-(--anchor-width) min-w-64"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              className="flex items-center gap-2"
              onClick={() => router.push(`/app/${org.slug}/dashboard`)}
            >
              <Avatar className="size-6 rounded-md">
                <AvatarImage src={org.logo ?? undefined} />
                <AvatarFallback className="rounded-md text-[10px]">
                  {getInitials(org.name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm">{org.name}</span>
              <RoleBadge role={org.role} className="text-[10px]" />
              {org.slug === currentSlug && (
                <Check className="size-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/app/new")}>
          <span className="flex size-5 items-center justify-center rounded-md border border-dashed">
            <Plus className="size-3.5" />
          </span>
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
