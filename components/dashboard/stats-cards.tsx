import { CalendarClock, CalendarCheck, CalendarX, Clock } from "lucide-react"

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
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completed",
      value: stats.completedCount,
      icon: CalendarCheck,
      description: "All-time completed",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Cancelled",
      value: stats.cancelledThisMonth,
      icon: CalendarX,
      description: "This month",
      color: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Hours booked",
      value: stats.totalHours,
      icon: Clock,
      description: "Total completed hours",
      color: "text-violet-600 dark:text-violet-400",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border bg-card p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {card.label}
            </p>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  )
}
