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
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const nav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, soon: false },
  {
    label: "Organizations",
    href: "/admin/organizations",
    icon: Building2,
    soon: false,
  },
  { label: "Users", href: "/admin/users", icon: Users, soon: false },
  {
    label: "Plans & Billing",
    href: "/admin/plans",
    icon: CreditCard,
    soon: true,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r bg-zinc-950 text-zinc-100">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600 text-xs font-bold">
          A
        </div>
        <div>
          <p className="text-sm font-semibold">Appointly</p>
          <p className="text-xs text-zinc-500">Platform Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active =
            !item.soon &&
            (item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href))
          const content = (
            <div
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.soon
                  ? "cursor-not-allowed text-zinc-600"
                  : active
                    ? "bg-violet-600/15 text-violet-300"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              )}
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.soon && (
                <Badge
                  variant="outline"
                  className="border-zinc-700 text-[10px] font-normal text-zinc-500"
                >
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

      <div className="border-t border-zinc-800 p-3">
        <Link
          href="/app"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workspace
        </Link>
      </div>
    </aside>
  )
}
