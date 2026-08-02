"use client"

import { useQuery } from "@tanstack/react-query"
import { startOfDay, endOfDay } from "date-fns"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading times...
      </div>
    )
  }

  if (isError || !data || "error" in data) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Couldn&apos;t load available times.
      </p>
    )
  }

  if (data.slots.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No available times on this date.
      </p>
    )
  }

  return (
    <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
      {data.slots.map((slot) => {
        const localTime = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: timezone,
        }).format(new Date(slot.start))
        const isSelected = selectedSlot === slot.start
        return (
          <Button
            key={slot.start}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectSlot(slot.start)}
          >
            {localTime}
          </Button>
        )
      })}
    </div>
  )
}
