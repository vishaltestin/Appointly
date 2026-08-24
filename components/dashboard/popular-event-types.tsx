import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { BarChart3 } from "lucide-react"

interface EventTypeStat {
  title: string
  count: number
  color: string
}

export function PopularEventTypes({
  eventTypes,
}: {
  eventTypes: EventTypeStat[]
}) {
  const maxCount = Math.max(...eventTypes.map((e) => e.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular event types</CardTitle>
        <CardDescription>Ranked by total bookings</CardDescription>
      </CardHeader>
      <CardContent>
      {eventTypes.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No bookings yet"
          description="Once bookings come in, your most popular event types rank here."
          className="border-0 py-8"
        />
      ) : (
        <div className="space-y-3">
          {eventTypes.map((et, i) => (
            <div key={et.title} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">
                    {i + 1}.
                  </span>
                  <span className="font-medium">{et.title}</span>
                </div>
                <span className="text-muted-foreground">
                  {et.count} booking{et.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(et.count / maxCount) * 100}%`,
                    backgroundColor: et.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      </CardContent>
    </Card>
  )
}
