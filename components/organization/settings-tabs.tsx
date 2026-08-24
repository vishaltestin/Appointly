"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SlidersHorizontal, Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Section navigation for workspace settings: an icon'd vertical rail on
 * desktop (sticky, so it stays in reach while editing long forms) and a
 * horizontally scrollable chip row on small screens.
 */
export function SettingsTabs({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname()
  const tabs = [
    {
      label: "General",
      href: `/app/${orgSlug}/settings/general`,
      icon: SlidersHorizontal,
      description: "Name, timezone & profile",
    },
    {
      label: "Members",
      href: `/app/${orgSlug}/settings/members`,
      icon: Users,
      description: "Roles, invites & seats",
    },
    {
      label: "Plan & Usage",
      href: `/app/${orgSlug}/settings/plan`,
      icon: Sparkles,
      description: "Subscription & limits",
    },
  ]

  return (
    <>
      {/* Mobile: horizontal chips */}
      <nav
        aria-label="Settings sections"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden"
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {/* Desktop: vertical rail */}
      <nav
        aria-label="Settings sections"
        className="hidden md:sticky md:top-8 md:flex md:flex-col md:gap-1 md:self-start"
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  active
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "bg-background text-muted-foreground group-hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{tab.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {tab.description}
                </span>
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
