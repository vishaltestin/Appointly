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
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        Popular event types
      </h2>
      {eventTypes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No bookings yet to rank.
        </p>
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
    </div>
  )
}
