"use client"

import { useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, X, Copy, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TimeSelect } from "@/components/availability/time-select"
import { updateWorkingHours } from "@/actions/availability.actions"

const DAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
}
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

interface TimeRange {
  startTime: string
  endTime: string
}
interface DayState {
  dayOfWeek: number
  enabled: boolean
  ranges: TimeRange[]
}
interface WorkingHoursInitial {
  dayOfWeek: number
  startTime: string
  endTime: string
}

function buildInitialState(initial: WorkingHoursInitial[]): DayState[] {
  return DISPLAY_ORDER.map((dayOfWeek) => {
    const ranges = initial
      .filter((h) => h.dayOfWeek === dayOfWeek)
      .map((h) => ({ startTime: h.startTime, endTime: h.endTime }))
    return {
      dayOfWeek,
      enabled: ranges.length > 0,
      ranges: ranges.length
        ? ranges
        : [{ startTime: "09:00", endTime: "17:00" }],
    }
  })
}

export function WeeklyHoursEditor({
  orgSlug,
  scheduleId,
  initialWorkingHours,
}: {
  orgSlug: string
  scheduleId: string
  initialWorkingHours: WorkingHoursInitial[]
}) {
  const queryClient = useQueryClient()
  const [days, setDays] = useState<DayState[]>(() =>
    buildInitialState(initialWorkingHours)
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function updateDay(dayOfWeek: number, updater: (day: DayState) => DayState) {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? updater(d) : d))
    )
  }

  function toggleDay(dayOfWeek: number, enabled: boolean) {
    updateDay(dayOfWeek, (d) => ({ ...d, enabled }))
  }

  function updateRange(
    dayOfWeek: number,
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) {
    updateDay(dayOfWeek, (d) => ({
      ...d,
      ranges: d.ranges.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }))
  }

  function addRange(dayOfWeek: number) {
    updateDay(dayOfWeek, (d) => ({
      ...d,
      ranges: [...d.ranges, { startTime: "13:00", endTime: "17:00" }],
    }))
  }

  function removeRange(dayOfWeek: number, index: number) {
    updateDay(dayOfWeek, (d) => ({
      ...d,
      ranges: d.ranges.filter((_, i) => i !== index),
    }))
  }

  function copyToAllDays(dayOfWeek: number) {
    const source = days.find((d) => d.dayOfWeek === dayOfWeek)
    if (!source) return
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        enabled: source.enabled,
        ranges: source.ranges.map((r) => ({ ...r })),
      }))
    )
  }

  function handleSave() {
    setError(null)
    setSuccess(null)
    const payload = {
      days: days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        ranges: d.enabled ? d.ranges : [],
      })),
    }

    startTransition(async () => {
      const res = await updateWorkingHours(orgSlug, scheduleId, payload)
      if (res?.error) {
        setError(res.error)
        return
      }
      setSuccess(res?.success ?? "Saved.")
      queryClient.invalidateQueries({
        queryKey: ["schedule-preview", scheduleId],
      })
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="divide-y rounded-lg border">
        {days.map((day) => (
          <div
            key={day.dayOfWeek}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start"
          >
            <div className="flex w-40 shrink-0 items-center gap-3">
              <Switch
                checked={day.enabled}
                onCheckedChange={(v) => toggleDay(day.dayOfWeek, Boolean(v))}
              />
              <span className="text-sm font-medium">
                {DAY_LABELS[day.dayOfWeek]}
              </span>
            </div>

            {day.enabled ? (
              <div className="flex flex-1 flex-col gap-2">
                {day.ranges.map((range, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <TimeSelect
                      value={range.startTime}
                      onChange={(v) =>
                        updateRange(day.dayOfWeek, index, "startTime", v)
                      }
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <TimeSelect
                      value={range.endTime}
                      onChange={(v) =>
                        updateRange(day.dayOfWeek, index, "endTime", v)
                      }
                    />
                    {day.ranges.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRange(day.dayOfWeek, index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {index === day.ranges.length - 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => addRange(day.dayOfWeek)}
                          >
                            Add time range
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyToAllDays(day.dayOfWeek)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy to all days
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex-1 text-sm text-muted-foreground">
                Unavailable
              </p>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save working hours
      </Button>
    </div>
  )
}
