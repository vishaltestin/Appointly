import Link from "next/link"
import { format } from "date-fns"
import { Clock, Mail, ArrowRight } from "lucide-react"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">
          Upcoming bookings
        </CardTitle>
        <Link href={`/app/${orgSlug}/bookings`}>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-muted-foreground">
            <p className="text-sm">No upcoming bookings.</p>
            <p className="text-xs">Share your event types to start getting booked.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {bookings.map((b) => (
              <Link
                key={b.id}
                href={`/app/${orgSlug}/bookings/${b.id}`}
                className="flex items-center justify-between gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(b.attendeeName)}
                    </AvatarFallback>
                  </Avatar>
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
                </div>
                <BookingStatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
