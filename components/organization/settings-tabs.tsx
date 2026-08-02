"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function SettingsTabs({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname()
  const tabs = [
    { label: "General", href: `/app/${orgSlug}/settings/general` },
    { label: "Members", href: `/app/${orgSlug}/settings/members` },
  ]

  return (
    <div className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
