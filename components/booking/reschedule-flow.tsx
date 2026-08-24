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

  // Live summary of the pending choice, shown in the footer so the confirm
  // action never feels disconnected from what was picked.
  const selectionSummary =
    selectedDate && selectedSlot
      ? `${format(selectedDate, "EEEE, MMMM d")} · ${new Intl.DateTimeFormat(
          "en-US",
          { hour: "numeric", minute: "2-digit", timeZone: timezone }
        ).format(new Date(selectedSlot))}`
      : null

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <TimezoneSelect value={timezone} onChange={setTimezone} />
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="min-w-0">
          <StepLabel step={1} title="Choose a day" />
          <BookingCalendar
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d)
              setSelectedSlot(null)
            }}
          />
        </div>
        <div className="min-w-0">
          <StepLabel
            step={2}
            title={
              selectedDate
                ? format(selectedDate, "EEEE, MMMM d")
                : "Choose a time"
            }
          />
          {selectedDate && (
            <TimeSlotList
              queryKey={[queryKeyPrefix, selectedDate.toDateString()]}
              fetchSlots={fetchSlots}
              date={selectedDate}
              timezone={timezone}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {selectionSummary ? (
            <>
              New time:{" "}
              <span className="font-medium text-foreground">
                {selectionSummary}
              </span>
            </>
          ) : (
            "Pick a day, then a time."
          )}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-10"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="h-10 px-6"
            onClick={handleConfirm}
            disabled={!selectedSlot || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm new time
          </Button>
        </div>
      </div>
    </div>
  )
}

function StepLabel({ step, title }: { step: number; title: string }) {
  return (
    <p className="mb-4 flex items-center gap-2.5 text-sm font-medium">
      <span
        aria-hidden
        className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
      >
        {step}
      </span>
      {title}
    </p>
  )
}
