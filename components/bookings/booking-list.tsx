import Link from "next/link"
import { format } from "date-fns"
import { Clock, Mail } from "lucide-react"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

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
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-16 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No bookings here yet
        </p>
        <p className="text-xs text-muted-foreground">
          Bookings will appear when clients schedule meetings with you.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="divide-y">
        {bookings.map((b) => (
          <Link
            key={b.id}
            href={`/app/${orgSlug}/bookings/${b.id}`}
            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(b.attendeeName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{b.eventTitle}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(b.startTime, "EEE, MMM d · h:mm a")} (
                    {b.durationMinutes}m)
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {b.attendeeName}
                  </span>
                </div>
              </div>
            </div>
            <BookingStatusBadge status={b.status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
