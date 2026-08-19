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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "@/components/organization/org-switcher"
import { Badge } from "@/components/ui/badge"
import { PlanBadge } from "@/components/shared/plan-badge"
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

  const nav = [
    {
      label: "Dashboard",
      href: `/app/${currentSlug}/dashboard`,
      match: `/app/${currentSlug}/dashboard`,
      icon: LayoutDashboard,
      soon: false,
    },
    {
      label: "Bookings",
      href: `/app/${currentSlug}/bookings`,
      match: `/app/${currentSlug}/bookings`,
      icon: CalendarClock,
      soon: false,
    },
    {
      label: "Event types",
      href: `/app/${currentSlug}/event-types`,
      match: `/app/${currentSlug}/event-types`,
      icon: LinkIcon,
      soon: false,
    },
    {
      label: "Availability",
      href: `/app/${currentSlug}/availability`,
      match: `/app/${currentSlug}/availability`,
      icon: Clock,
      soon: false,
    },
    {
      label: "Customers",
      href: `/app/${currentSlug}/customers`,
      match: `/app/${currentSlug}/customers`,
      icon: Users,
      soon: false,
    },
    {
      label: "Settings",
      href: `/app/${currentSlug}/settings/general`,
      match: `/app/${currentSlug}/settings`,
      icon: Settings,
      soon: false,
    },
  ]

  return (
    <aside className="flex w-64 flex-col border-r bg-background">
      <div className="space-y-2 border-b p-4">
        <OrgSwitcher organizations={organizations} currentSlug={currentSlug} />
        <Link
          href={`/app/${currentSlug}/settings/plan`}
          className="flex items-center gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <PlanBadge plan={plan} />
          <span>plan</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = !item.soon && pathname.startsWith(item.match)
          const content = (
            <div
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.soon
                  ? "cursor-not-allowed text-muted-foreground/50"
                  : active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.soon && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  Soon
                </Badge>
              )}
            </div>
          )

          return item.soon ? (
            <div key={item.href}>{content}</div>
          ) : (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
