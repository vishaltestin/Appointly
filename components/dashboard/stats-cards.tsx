import { CalendarClock, CalendarCheck, CalendarX, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Stats {
  upcomingCount: number
  completedCount: number
  cancelledThisMonth: number
  totalHours: number
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Upcoming",
      value: stats.upcomingCount,
      icon: CalendarClock,
      description: "Confirmed bookings ahead",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completed",
      value: stats.completedCount,
      icon: CalendarCheck,
      description: "All-time completed",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Cancelled",
      value: stats.cancelledThisMonth,
      icon: CalendarX,
      description: "This month",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    {
      label: "Hours booked",
      value: stats.totalHours,
      icon: Clock,
      description: "Total completed hours",
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              {card.label}
            </CardTitle>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-md",
                card.color
              )}
            >
              <card.icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
