"use client"

import { useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Trash2, CalendarOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddOverrideDialog } from "@/components/availability/add-override-dialog"
import { removeDateOverride } from "@/actions/availability.actions"
import { formatTimeLabel } from "@/lib/availability"

interface OverrideRow {
  id: string
  date: Date
  type: "UNAVAILABLE" | "CUSTOM_HOURS"
  startTime: string | null
  endTime: string | null
  reason: string | null
}

export function DateOverridesManager({
  orgSlug,
  scheduleId,
  overrides,
}: {
  orgSlug: string
  scheduleId: string
  overrides: OverrideRow[]
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeDateOverride(orgSlug, scheduleId, id)
      queryClient.invalidateQueries({
        queryKey: ["schedule-preview", scheduleId],
      })
    })
  }

  const sorted = [...overrides].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Date overrides</h3>
          <p className="text-sm text-muted-foreground">
            Holidays and one-off exceptions to your weekly hours.
          </p>
        </div>
        <AddOverrideDialog orgSlug={orgSlug} scheduleId={scheduleId} />
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No date overrides yet.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {sorted.map((override) => (
            <div
              key={override.id}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-3">
                {override.type === "UNAVAILABLE" ? (
                  <CalendarOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {format(override.date, "PPP")}
                    {override.reason && (
                      <span className="ml-2 text-muted-foreground">
                        — {override.reason}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {override.type === "UNAVAILABLE"
                      ? "Unavailable all day"
                      : `${formatTimeLabel(override.startTime!)} – ${formatTimeLabel(override.endTime!)}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleRemove(override.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
