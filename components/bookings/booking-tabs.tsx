"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function BookingTabs({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get("tab") ?? "upcoming"

  const tabs = [
    { key: "upcoming", label: "Upcoming", count: 0 },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "past", label: "Past", count: 0 },
    { key: "cancelled", label: "Cancelled", count: 0 },
  ]

  return (
    <div className="flex gap-1 border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${pathname}?tab=${tab.key}`}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {tab.count}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  )
}
