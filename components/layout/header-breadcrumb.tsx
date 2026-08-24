"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/** Human labels for known route segments; unknown ids show as "Details". */
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  "event-types": "Event types",
  availability: "Availability",
  customers: "Customers",
  settings: "Settings",
  general: "General",
  members: "Members",
  plan: "Plan",
  organizations: "Organizations",
  users: "Users",
  plans: "Plans & billing",
  new: "New workspace",
}

/**
 * Derives breadcrumbs from the pathname, skipping the org slug:
 * `/app/acme/bookings/abc` → Bookings / Details
 * `/admin/organizations/xyz` → Admin / Organizations / Details
 */
export function HeaderBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const isApp = segments[0] === "app"
  const isAdmin = segments[0] === "admin"
  if (!isApp && !isAdmin) return null

  const prefix = isApp ? `/app/${segments[1]}` : "/admin"
  const rest = isApp ? segments.slice(2) : segments.slice(1)
  if (rest.length === 0 && !isAdmin) return null

  const items: { label: string; href: string }[] = []
  if (isAdmin) {
    items.push({ label: "Admin", href: "/admin" })
  }
  rest.forEach((seg, i) => {
    items.push({
      label: LABELS[seg] ?? (seg.length > 12 ? "Details" : capitalize(seg)),
      href: `${prefix}/${rest.slice(0, i + 1).join("/")}`,
    })
  })

  if (items.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <React.Fragment key={`${item.href}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={item.href}>{item.label}</Link>}
                  />
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")
}
