import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ChevronLeft,
  Clock,
  Mail,
  User,
  MessageSquare,
  ArrowRight,
} from "lucide-react"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"
import { CancelBookingDialog } from "@/components/bookings/cancel-booking-dialog"
import { RescheduleBookingDialog } from "@/components/bookings/reschedule-booking-dialog"
import { PendingBookingActions } from "@/components/bookings/pending-booking-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; bookingId: string }>
}) {
  const { orgSlug, bookingId } = await params
  const membership = await requireOrgMembership(orgSlug)

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      eventType: { include: { questions: true } },
      rescheduledFrom: true,
      rescheduledTo: true,
    },
  })

  if (!booking || booking.organizationId !== membership.organizationId)
    notFound()

  const isUpcoming =
    booking.status === "CONFIRMED" && booking.startTime > new Date()
  const responses = (booking.responses as Record<string, string> | null) ?? {}

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/app/${orgSlug}/bookings`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to bookings
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {booking.eventTitle}
          </h1>
          <BookingStatusBadge status={booking.status} />
        </div>
        {booking.rescheduledFrom && (
          <p className="mt-1 text-sm text-muted-foreground">
            Rescheduled from{" "}
            <Link
              href={`/app/${orgSlug}/bookings/${booking.rescheduledFrom.id}`}
              className="underline"
            >
              {format(booking.rescheduledFrom.startTime, "MMM d, h:mm a")}
            </Link>
          </p>
        )}
      </div>

      {booking.rescheduledTo && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-4 text-sm">
          This booking was rescheduled to{" "}
          <Link
            href={`/app/${orgSlug}/bookings/${booking.rescheduledTo.id}`}
            className="inline-flex items-center gap-1 font-medium underline"
          >
            {format(booking.rescheduledTo.startTime, "MMM d, h:mm a")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs">
                {getInitials(booking.attendeeName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{booking.attendeeName}</p>
              <p className="text-sm text-muted-foreground">
                {booking.attendeeEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {format(booking.startTime, "EEEE, MMMM d, yyyy · h:mm a")} (
            {booking.durationMinutes} min)
          </div>
          {booking.attendeeNotes && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p>{booking.attendeeNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {booking.eventType && booking.eventType.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.eventType.questions.map((q) => (
              <div key={q.id}>
                <p className="text-xs text-muted-foreground">{q.label}</p>
                <p className="mt-0.5 text-sm font-medium">
                  {responses[q.id] || "—"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {booking.status === "CANCELLED" && !booking.rescheduledTo && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            Cancelled by{" "}
            {booking.cancelledBy === "HOST" ? "you" : "the attendee"}
          </p>
          {booking.cancellationReason && (
            <p className="mt-1 text-muted-foreground">
              &quot;{booking.cancellationReason}&quot;
            </p>
          )}
        </div>
      )}

      {booking.status === "PENDING" && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm text-muted-foreground">
              This booking is awaiting your approval.
            </p>
            <PendingBookingActions
              orgSlug={orgSlug}
              bookingId={booking.id}
              size="default"
            />
          </CardContent>
        </Card>
      )}

      {isUpcoming && (
        <div className="flex gap-2">
          <RescheduleBookingDialog orgSlug={orgSlug} bookingId={booking.id} />
          <CancelBookingDialog
            orgSlug={orgSlug}
            bookingId={booking.id}
            variant="destructive"
          />
        </div>
      )}
    </div>
  )
}
