import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Popular event types
        </CardTitle>
      </CardHeader>
      <CardContent>
        {eventTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-muted-foreground">
            <p className="text-sm">No bookings yet to rank.</p>
            <p className="text-xs">Create event types to start accepting bookings.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventTypes.map((et, i) => (
              <div key={et.title} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium">{et.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {et.count} booking{et.count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
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
