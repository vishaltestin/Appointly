"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ArrowLeft,
} from "lucide-react"
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
} from "@/components/ui/sidebar"
import { Brand } from "@/components/layout/brand"
import { Badge } from "@/components/ui/badge"

const nav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Plans & billing", href: "/admin/plans", icon: CreditCard },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link href="/admin">
                  <Brand
                    labelClassName="text-sm"
                    iconClassName="size-8 rounded-lg [&_svg]:size-4"
                  />
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={
                      item.exact ? pathname === item.href : pathname.startsWith(item.href)
                    }
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

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <div className="rounded-lg border bg-muted/50 p-3">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20"
            >
              Super admin
            </Badge>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              You are viewing platform-wide data. Changes here affect every
              workspace.
            </p>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Back to workspace"
              render={
                <Link href="/app">
                  <ArrowLeft />
                  <span>Back to workspace</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
