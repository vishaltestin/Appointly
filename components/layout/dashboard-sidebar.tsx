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
  ExternalLink,
  ArrowUpRight,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { OrgSwitcher } from "@/components/organization/org-switcher"
import { PlanBadge } from "@/components/shared/plan-badge"
import { permissions } from "@/lib/permissions"
import type { OrgRole, SubscriptionPlan } from "@/generated/prisma/client"

interface SidebarOrg {
  id: string
  name: string
  slug: string
  logo: string | null
  role: OrgRole
}

export function DashboardSidebar({
  organizations,
  currentSlug,
  plan,
}: {
  organizations: SidebarOrg[]
  currentSlug: string
  plan: SubscriptionPlan
}) {
  const pathname = usePathname()

  // The org switcher payload already carries this user's role per org, so
  // derive the current one from it instead of threading another prop. Role
  // drives which nav entries exist at all: a MEMBER only ever runs their
  // own calendar, so workspace administration (Settings, plan page) is
  // hidden from them entirely — matching the server-side gate in
  // settings/layout.tsx.
  const currentRole =
    organizations.find((org) => org.slug === currentSlug)?.role ?? "MEMBER"
  const canAdminister = permissions.canEditOrganization(currentRole)

  const mainNav = [
    {
      label: "Dashboard",
      href: `/app/${currentSlug}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Bookings",
      href: `/app/${currentSlug}/bookings`,
      icon: CalendarClock,
    },
    {
      label: "Event types",
      href: `/app/${currentSlug}/event-types`,
      icon: LinkIcon,
    },
    {
      label: "Availability",
      href: `/app/${currentSlug}/availability`,
      icon: Clock,
    },
    {
      label: "Customers",
      href: `/app/${currentSlug}/customers`,
      icon: Users,
    },
  ]

  const workspaceNav = [
    ...(canAdminister
      ? [
          {
            label: "Settings",
            href: `/app/${currentSlug}/settings/general`,
            match: `/app/${currentSlug}/settings`,
            icon: Settings,
          },
        ]
      : []),
    {
      label: "Booking page",
      href: `/book/${currentSlug}`,
      match: null,
      icon: ExternalLink,
      external: true,
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <OrgSwitcher
              organizations={organizations}
              currentSlug={currentSlug}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Schedule</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={item.match ? pathname.startsWith(item.match) : false}
                    tooltip={item.label}
                    render={
                      <Link
                        href={item.href}
                        {...("external" in item && item.external
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {canAdminister && (
        <>
          <SidebarSeparator />
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Manage plan"
                  render={
                    <Link href={`/app/${currentSlug}/settings/plan`}>
                      <ArrowUpRight />
                      <span className="flex items-center gap-2">
                        <PlanBadge plan={plan} />
                        <span className="text-sidebar-foreground/70">plan</span>
                      </span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </>
      )}

      <SidebarRail />
    </Sidebar>
  )
}
