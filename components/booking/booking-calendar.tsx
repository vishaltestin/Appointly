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
      className="rounded-lg border"
    />
  )
}
