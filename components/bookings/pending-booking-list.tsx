import { format } from "date-fns"
import { Clock, Mail, UserRound } from "lucide-react"
import { PendingBookingActions } from "@/components/bookings/pending-booking-actions"
import { BookingDateChip } from "@/components/bookings/booking-date-chip"

interface PendingBooking {
  id: string
  eventTitle: string
  durationMinutes: number
  attendeeName: string
  attendeeEmail: string
  hostName: string
  startTime: Date
}

export function PendingBookingList({
  orgSlug,
  bookings,
  showHost = false,
}: {
  orgSlug: string
  bookings: PendingBooking[]
  /** OWNER/ADMIN view bookings workspace-wide, so each row names its host. */
  showHost?: boolean
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
          <div className="flex min-w-0 items-center gap-3.5">
            <BookingDateChip date={b.startTime} />
            <div className="min-w-0">
              <p className="truncate font-medium">{b.eventTitle}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(b.startTime, "EEE · h:mm a")} ({b.durationMinutes}
                  m)
                </span>
                <span className="flex min-w-0 items-center gap-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {b.attendeeName} · {b.attendeeEmail}
                  </span>
                </span>
                {showHost && (
                  <span className="flex shrink-0 items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" />
                    hosted by {b.hostName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <PendingBookingActions orgSlug={orgSlug} bookingId={b.id} />
        </div>
      ))}
    </div>
  )
}
