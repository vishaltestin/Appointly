"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarClock,
  Clock,
  Users,
  Settings,
  Link as LinkIcon,
  CalendarDays,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "@/components/organization/org-switcher"
import { PlanBadge } from "@/components/shared/plan-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item"
import { getInitials } from "@/lib/utils"
import type { OrgRole, SubscriptionPlan } from "@/generated/prisma/client"

interface SidebarOrg {
  id: string
  name: string
  slug: string
  logo: string | null
  role: OrgRole
}

interface AppSidebarProps {
  organizations: SidebarOrg[]
  currentSlug: string
  plan: SubscriptionPlan
  user: { name?: string | null; email?: string | null; image?: string | null }
  isSuperAdmin?: boolean
}

const navItems = (currentSlug: string) => [
  {
    label: "Dashboard",
    href: `/app/${currentSlug}/dashboard`,
    match: `/app/${currentSlug}/dashboard`,
    icon: LayoutDashboard,
  },
  {
    label: "Bookings",
    href: `/app/${currentSlug}/bookings`,
    match: `/app/${currentSlug}/bookings`,
    icon: CalendarClock,
  },
  {
    label: "Event types",
    href: `/app/${currentSlug}/event-types`,
    match: `/app/${currentSlug}/event-types`,
    icon: LinkIcon,
  },
  {
    label: "Availability",
    href: `/app/${currentSlug}/availability`,
    match: `/app/${currentSlug}/availability`,
    icon: Clock,
  },
  {
    label: "Customers",
    href: `/app/${currentSlug}/customers`,
    match: `/app/${currentSlug}/customers`,
    icon: Users,
  },
  {
    label: "Settings",
    href: `/app/${currentSlug}/settings/general`,
    match: `/app/${currentSlug}/settings`,
    icon: Settings,
  },
]

function SidebarUserMenu({
  user,
  isSuperAdmin,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isSuperAdmin?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon className="mr-2 size-4" />
            Account settings
          </DropdownMenuItem>
          {isSuperAdmin && (
            <DropdownMenuItem>
              <Link href="/admin" className="flex items-center">
                <ShieldCheck className="mr-2 size-4" />
                Platform admin
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <SignOutMenuItem />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppSidebar({
  organizations,
  currentSlug,
  plan,
  user,
  isSuperAdmin,
}: AppSidebarProps) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const nav = navItems(currentSlug)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher organizations={organizations} currentSlug={currentSlug} />
        <Link
          href={`/app/${currentSlug}/settings/plan`}
          className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <PlanBadge plan={plan} />
          <span className="group-data-[collapsible=icon]:hidden">plan</span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = pathname.startsWith(item.match)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false)
                          }}
                        />
                      }
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarUserMenu user={user} isSuperAdmin={isSuperAdmin} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
