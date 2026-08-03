"use client"

import { useState, useTransition } from "react"
import { useBrowserTimezone } from "@/hooks/use-browser-timezone"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { BookingCalendar } from "@/components/booking/booking-calendar"
import { TimeSlotList } from "@/components/booking/time-slot-list"
import { TimezoneSelect } from "@/components/booking/timezone-select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

type SlotsResult =
  | { slots: { start: string; end: string }[]; timezone: string }
  | { error: string }

interface Props {
  queryKeyPrefix: string
  fetchSlots: (
    rangeStartISO: string,
    rangeEndISO: string
  ) => Promise<SlotsResult>
  onConfirm: (newStartTimeISO: string) => Promise<{ error?: string }>
  onCancel: () => void
}

export function RescheduleFlow({
  queryKeyPrefix,
  fetchSlots,
  onConfirm,
  onCancel,
}: Props) {
  const [timezone, setTimezone] = useBrowserTimezone()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    if (!selectedSlot) return
    setError(null)
    startTransition(async () => {
      const res = await onConfirm(selectedSlot)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <TimezoneSelect value={timezone} onChange={setTimezone} />
      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <BookingCalendar
          selected={selectedDate}
          onSelect={(d) => {
            setSelectedDate(d)
            setSelectedSlot(null)
          }}
        />
        <div>
          {selectedDate && (
            <>
              <p className="mb-3 text-sm font-medium">
                {format(selectedDate, "EEEE, MMMM d")}
              </p>
              <TimeSlotList
                queryKey={[queryKeyPrefix, selectedDate.toDateString()]}
                fetchSlots={fetchSlots}
                date={selectedDate}
                timezone={timezone}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedSlot || isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm new time
        </Button>
      </div>
    </div>
  )
}
