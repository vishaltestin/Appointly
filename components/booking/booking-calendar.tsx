"use client"

import { startOfDay } from "date-fns"
import { Calendar } from "@/components/ui/calendar"

export function BookingCalendar({
  selected,
  onSelect,
}: {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
}) {
  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={{ before: startOfDay(new Date()) }}
      // Generous cell size + breathing room: this calendar is the primary
      // picking surface on booking & reschedule screens, not a date input.
      className="rounded-xl border bg-card p-3 [--cell-size:--spacing(9)]"
    />
  )
}
