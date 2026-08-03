import Link from "next/link"
import { format } from "date-fns"
import { Clock, Mail, ArrowRight } from "lucide-react"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"

interface UpcomingBooking {
  id: string
  eventTitle: string
  startTime: Date
  durationMinutes: number
  attendeeName: string
  attendeeEmail: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
}

export function UpcomingBookingsList({
  orgSlug,
  bookings,
}: {
  orgSlug: string
  bookings: UpcomingBooking[]
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Upcoming bookings</h2>
        <Link
          href={`/app/${orgSlug}/bookings`}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No upcoming bookings.
        </p>
      ) : (
        <div className="divide-y">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/app/${orgSlug}/bookings/${b.id}`}
              className="-mx-2 flex items-center justify-between gap-3 rounded px-2 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-muted/30"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{b.eventTitle}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(b.startTime, "MMM d · h:mm a")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {b.attendeeName}
                  </span>
                </div>
              </div>
              <BookingStatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
