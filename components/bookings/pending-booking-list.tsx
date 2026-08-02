import { format } from "date-fns"
import { Clock, Mail } from "lucide-react"
import { PendingBookingActions } from "@/components/bookings/pending-booking-actions"

interface PendingBooking {
  id: string
  eventTitle: string
  durationMinutes: number
  attendeeName: string
  attendeeEmail: string
  startTime: Date
}

export function PendingBookingList({
  orgSlug,
  bookings,
}: {
  orgSlug: string
  bookings: PendingBooking[]
}) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        No bookings awaiting approval.
      </div>
    )
  }

  return (
    <div className="divide-y rounded-lg border">
      {bookings.map((b) => (
        <div
          key={b.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{b.eventTitle}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(b.startTime, "EEE, MMM d · h:mm a")} (
                {b.durationMinutes}m)
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {b.attendeeName} · {b.attendeeEmail}
              </span>
            </div>
          </div>
          <PendingBookingActions orgSlug={orgSlug} bookingId={b.id} />
        </div>
      ))}
    </div>
  )
}
