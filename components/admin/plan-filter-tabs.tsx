"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { PLANS, PLAN_ORDER } from "@/lib/plans"

const FILTERS = [
  { id: "ALL", label: "All" },
  ...PLAN_ORDER.map((id) => ({ id, label: PLANS[id].name })),
]

export function PlanFilterTabs({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get("plan") ?? "ALL"

  return (
    <div className="flex flex-wrap gap-1 border-b">
      {FILTERS.map((filter) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("plan", filter.id)
        // Any filter change invalidates the current page offset.
        params.delete("page")
        const isActive = active === filter.id

        return (
          <Link
            key={filter.id}
            href={`${pathname}?${params.toString()}`}
            className={cn(
              "border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {filter.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {counts[filter.id] ?? 0}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
