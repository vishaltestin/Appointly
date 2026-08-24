import Link from "next/link"
import { format } from "date-fns"
import { CalendarClock, ChevronRight, Clock, Mail, UserRound } from "lucide-react"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"
import { BookingDateChip } from "@/components/bookings/booking-date-chip"
import { EmptyState } from "@/components/shared/empty-state"

interface BookingRow {
  id: string
  eventTitle: string
  durationMinutes: number
  attendeeName: string
  attendeeEmail: string
  hostName: string
  startTime: Date
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
}

export function BookingList({
  orgSlug,
  bookings,
  showHost = false,
}: {
  orgSlug: string
  bookings: BookingRow[]
  /** OWNER/ADMIN view bookings workspace-wide, so each row names its host. */
  showHost?: boolean
}) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No bookings here yet"
        description="Bookings land here the moment someone picks a time on your public booking page."
        action={{ href: `/app/${orgSlug}/event-types`, label: "View event types" }}
      />
    )
  }

  return (
    <div className="divide-y rounded-xl border bg-card">
      {bookings.map((b) => (
        <Link
          key={b.id}
          href={`/app/${orgSlug}/bookings/${b.id}`}
          className="group flex items-center justify-between gap-4 p-4 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/40"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <BookingDateChip date={b.startTime} />
            <div className="min-w-0">
              <p className="truncate font-medium">{b.eventTitle}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex shrink-0 items-center gap-1">
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
          <div className="flex shrink-0 items-center gap-2.5">
            <BookingStatusBadge status={b.status} />
            <ChevronRight className="size-4 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground max-sm:hidden" />
          </div>
        </Link>
      ))}
    </div>
  )
}
