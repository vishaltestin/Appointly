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
  Globe,
  Info,
} from "lucide-react"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"
import { CancelBookingDialog } from "@/components/bookings/cancel-booking-dialog"
import { RescheduleBookingDialog } from "@/components/bookings/reschedule-booking-dialog"
import { PendingBookingActions } from "@/components/bookings/pending-booking-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <div className="max-w-5xl space-y-6">
      <div>
        <Link
          href={`/app/${orgSlug}/bookings`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to bookings
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {booking.eventTitle}
          </h1>
          <div className="flex items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            {isUpcoming && (
              <>
                <RescheduleBookingDialog
                  orgSlug={orgSlug}
                  bookingId={booking.id}
                />
                <CancelBookingDialog
                  orgSlug={orgSlug}
                  bookingId={booking.id}
                  variant="destructive"
                />
              </>
            )}
          </div>
        </div>
        {booking.rescheduledFrom && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            Rescheduled from{" "}
            <Link
              href={`/app/${orgSlug}/bookings/${booking.rescheduledFrom.id}`}
              className="underline underline-offset-2"
            >
              {format(booking.rescheduledFrom.startTime, "MMM d, h:mm a")}
            </Link>
          </p>
        )}
      </div>

      {booking.rescheduledTo && (
        <Alert>
          <Info />
          <AlertDescription>
            This booking was rescheduled to{" "}
            <Link
              href={`/app/${orgSlug}/bookings/${booking.rescheduledTo.id}`}
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
            >
              {format(booking.rescheduledTo.startTime, "MMM d, h:mm a")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {booking.status === "CANCELLED" && !booking.rescheduledTo && (
        <Alert variant="destructive">
          <Info />
          <AlertDescription>
            <span className="font-medium">
              Cancelled by{" "}
              {booking.cancelledBy === "HOST" ? "you" : "the attendee"}
            </span>
            {booking.cancellationReason && (
              <span className="block text-muted-foreground">
                &quot;{booking.cancellationReason}&quot;
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {booking.status === "PENDING" && (
        <Alert>
          <Info />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>This booking is awaiting your approval.</span>
            <PendingBookingActions
              orgSlug={orgSlug}
              bookingId={booking.id}
              size="sm"
            />
          </AlertDescription>
        </Alert>
      )}

      {/* Two-up on desktop when responses exist; the details card takes the
          full width otherwise so no side sits empty. */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card
          className={
            booking.eventType && booking.eventType.questions.length > 0
              ? undefined
              : "lg:col-span-2"
          }
        >
          <CardHeader>
            <CardTitle>Meeting details</CardTitle>
            <CardDescription>
              Snapshot taken when the booking was made
            </CardDescription>
          </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <DetailRow icon={Clock} label="When">
              {format(booking.startTime, "EEEE, MMMM d, yyyy")} ·{" "}
              {format(booking.startTime, "h:mm a")} –{" "}
              {format(booking.endTime, "h:mm a")} ({booking.durationMinutes}{" "}
              min)
            </DetailRow>
            <DetailRow icon={Globe} label="Attendee time zone">
              {booking.attendeeTimezone}
            </DetailRow>
            <DetailRow icon={User} label="Attendee">
              {booking.attendeeName}
            </DetailRow>
            <DetailRow icon={Mail} label="Email">
              {booking.attendeeEmail}
            </DetailRow>
            <DetailRow icon={User} label="Host">
              {booking.hostName} · {booking.hostEmail}
            </DetailRow>
            {booking.attendeeNotes && (
              <DetailRow icon={MessageSquare} label="Notes">
                {booking.attendeeNotes}
              </DetailRow>
            )}
          </dl>
        </CardContent>
      </Card>

      {booking.eventType && booking.eventType.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Responses</CardTitle>
            <CardDescription>
              Custom questions answered at booking time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              {booking.eventType.questions.map((q) => (
                <div
                  key={q.id}
                  className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[200px_1fr] sm:gap-4"
                >
                  <dt className="text-sm text-muted-foreground">{q.label}</dt>
                  <dd className="text-sm">{responses[q.id] || "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm">{children}</dd>
      </div>
    </div>
  )
}
