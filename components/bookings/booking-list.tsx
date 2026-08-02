import Link from "next/link"
import { format } from "date-fns"
import { Clock, Mail } from "lucide-react"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"

interface BookingRow {
  id: string
  eventTitle: string
  durationMinutes: number
  attendeeName: string
  attendeeEmail: string
  startTime: Date
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
}

export function BookingList({
  orgSlug,
  bookings,
}: {
  orgSlug: string
  bookings: BookingRow[]
}) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        No bookings here yet.
      </div>
    )
  }

  return (
    <div className="divide-y rounded-lg border">
      {bookings.map((b) => (
        <Link
          key={b.id}
          href={`/app/${orgSlug}/bookings/${b.id}`}
          className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
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
          <BookingStatusBadge status={b.status} />
        </Link>
      ))}
    </div>
  )
}
