"use client"

import { useQuery } from "@tanstack/react-query"
import { startOfDay, endOfDay } from "date-fns"
import { CalendarX2, TriangleAlert } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type SlotsResult =
  | { slots: { start: string; end: string }[]; timezone: string }
  | { error: string }

interface Props {
  queryKey: unknown[]
  fetchSlots: (
    rangeStartISO: string,
    rangeEndISO: string
  ) => Promise<SlotsResult>
  date: Date
  timezone: string
  selectedSlot: string | null
  onSelectSlot: (iso: string) => void
}

/**
 * Pickable availability for one day, rendered as a scrollable column of
 * full-width time buttons (Calendly-style) rather than a cramped grid —
 * a fixed-height column never overflows its parent regardless of width.
 */
export function TimeSlotList({
  queryKey,
  fetchSlots,
  date,
  timezone,
  selectedSlot,
  onSelectSlot,
}: Props) {
  const rangeStart = startOfDay(date)
  const rangeEnd = endOfDay(date)

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchSlots(rangeStart.toISOString(), rangeEnd.toISOString()),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Loading available times">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError || !data || "error" in data) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TriangleAlert className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load available times.
        </p>
      </div>
    )
  }

  if (data.slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarX2 className="size-5" />
        </span>
        <div>
          <p className="text-sm font-medium">No times available</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Try another day on the calendar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      role="listbox"
      aria-label="Available times"
        className="mx-auto flex max-h-80 w-full max-w-[340px] flex-col gap-2.5 overflow-y-auto overscroll-contain pr-1 sm:mx-0"
    >
      {data.slots.map((slot) => {
        const localTime = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: timezone,
        }).format(new Date(slot.start))
        const isSelected = selectedSlot === slot.start
        return (
          <button
            key={slot.start}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelectSlot(slot.start)}
            className={cn(
              "h-10 w-full shrink-0 rounded-lg text-sm font-medium ring-1 transition-all duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isSelected
                ? "bg-primary text-primary-foreground ring-primary shadow-sm"
                : "bg-background ring-foreground/15 hover:bg-accent hover:text-accent-foreground hover:ring-foreground/25"
            )}
          >
            {localTime}
          </button>
        )
      })}
    </div>
  )
}
