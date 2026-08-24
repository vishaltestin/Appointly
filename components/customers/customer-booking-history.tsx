import Link from "next/link"
import { format } from "date-fns"
import { Clock } from "lucide-react"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"
import { BookingDateChip } from "@/components/bookings/booking-date-chip"

interface BookingRow {
  id: string
  eventTitle: string
  startTime: Date
  durationMinutes: number
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
  hostName: string
  cancelledBy: "HOST" | "ATTENDEE" | null
  cancellationReason: string | null
}

export function CustomerBookingHistory({
  orgSlug,
  bookings,
}: {
  orgSlug: string
  bookings: BookingRow[]
}) {
  if (bookings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No bookings yet.
      </p>
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
          <div className="flex min-w-0 items-center gap-3.5">
            <BookingDateChip date={b.startTime} />
            <div className="min-w-0">
              <p className="truncate font-medium">{b.eventTitle}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {format(b.startTime, "EEE · h:mm a, yyyy")} (
                  {b.durationMinutes}m)
                  {" · with "}
                  {b.hostName}
                </span>
              </p>
              {b.status === "CANCELLED" && b.cancellationReason && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  &quot;{b.cancellationReason}&quot;
                </p>
              )}
            </div>
          </div>
          <BookingStatusBadge status={b.status} className="shrink-0" />
        </Link>
      ))}
    </div>
  )
}
