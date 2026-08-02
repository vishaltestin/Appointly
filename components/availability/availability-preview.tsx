"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, Sparkles } from "lucide-react"
import { getSchedulePreview } from "@/actions/availability.actions"

export function AvailabilityPreview({
  orgSlug,
  scheduleId,
}: {
  orgSlug: string
  scheduleId: string
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["schedule-preview", scheduleId],
    queryFn: () => getSchedulePreview(orgSlug, scheduleId),
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Calculating available slots...
      </div>
    )
  }

  if (isError || !data || "error" in data || !data.slots) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Couldn&apos;t load a preview right now.
      </div>
    )
  }

  const grouped = new Map<string, typeof data.slots>()
  for (const slot of data.slots) {
    const key = format(new Date(slot.start), "EEE, MMM d")
    grouped.set(key, [...(grouped.get(key) ?? []), slot])
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Live preview — next 7 days</h3>
      </div>
      {grouped.size === 0 ? (
        <p className="text-sm text-muted-foreground">
          No available slots in the next 7 days.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(grouped.entries()).map(([day, slots]) => (
            <div key={day} className="rounded-md border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {day}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {slots.slice(0, 6).map((slot, i) => (
                  <span key={i} className="rounded bg-muted px-2 py-1 text-xs">
                    {format(new Date(slot.start), "h:mm a")}
                  </span>
                ))}
                {slots.length > 6 && (
                  <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    +{slots.length - 6} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Shown using a 30-minute default duration. Doesn&apos;t yet account for
        real bookings — that connects automatically once the booking module
        ships.
      </p>
    </div>
  )
}
