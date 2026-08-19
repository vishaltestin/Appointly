import { CalendarClock, CalendarCheck, CalendarX, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Completed",
      value: stats.completedCount,
      icon: CalendarCheck,
      description: "All-time completed",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Cancelled",
      value: stats.cancelledThisMonth,
      icon: CalendarX,
      description: "This month",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      label: "Hours booked",
      value: stats.totalHours,
      icon: Clock,
      description: "Total completed hours",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <div className={`rounded-lg p-1.5 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-1 h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
