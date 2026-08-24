import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  CheckCircle2,
  Clock,
  Hourglass,
  Mail,
  MapPin,
  Phone,
  Video,
  FileText,
} from "lucide-react"
import { db } from "@/lib/db"
import { generateICS } from "@/lib/ics"
import { AddToCalendarButton } from "@/components/booking/add-to-calendar-button"
import { LinkButton } from "@/components/shared/link-button"

const LOCATION_ICONS = {
  IN_PERSON: MapPin,
  PHONE_CALL: Phone,
  ONLINE_MEETING: Video,
  CUSTOM: FileText,
}

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ orgSlug: string; eventSlug: string; bookingId: string }>
}) {
  const { orgSlug, bookingId } = await params

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { eventType: true, organization: { select: { slug: true } } },
  })
  if (!booking || booking.organization.slug !== orgSlug) notFound()

  const isPending = booking.status === "PENDING"

  const locationType = booking.eventType?.locationType ?? "ONLINE_MEETING"
  const LocationIcon = LOCATION_ICONS[locationType]
  const locationLabel =
    booking.eventType?.locationValue ||
    (locationType === "ONLINE_MEETING"
      ? "Online meeting"
      : locationType === "PHONE_CALL"
        ? "Phone call"
        : locationType === "IN_PERSON"
          ? "In person"
          : "Details to follow")

  const icsContent = generateICS({
    uid: booking.id,
    title: booking.eventTitle,
    description: booking.attendeeNotes ?? undefined,
    location: booking.eventType?.locationValue ?? undefined,
    start: booking.startTime,
    end: booking.endTime,
    organizerEmail: booking.hostEmail,
    attendeeEmail: booking.attendeeEmail,
  })

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-12 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg shadow-foreground/5">
        {isPending ? (
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10 ring-4 ring-amber-500/5">
            <Hourglass className="size-7 text-amber-600 dark:text-amber-400" />
          </span>
        ) : (
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/5">
            <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
          </span>
        )}
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          {isPending ? "Request sent" : "Booking confirmed"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isPending ? (
            <>
              {booking.hostName} will review your request — you&apos;ll get an
              email at {booking.attendeeEmail} once it&apos;s confirmed.
            </>
          ) : (
            <>A confirmation has been sent to {booking.attendeeEmail}.</>
          )}
        </p>

        <div className="mt-6 space-y-2.5 rounded-xl bg-muted/70 p-4 text-left text-sm">
          <p className="font-medium">{booking.eventTitle}</p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            {format(booking.startTime, "EEEE, MMMM d · h:mm a")} (
            {booking.durationMinutes} min)
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <LocationIcon className="h-4 w-4 shrink-0" />
            <span className="break-all">{locationLabel}</span>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            with {booking.hostName}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {!isPending && (
            <AddToCalendarButton
              icsContent={icsContent}
              filename={`${booking.eventTitle}.ics`}
            />
          )}
          <LinkButton
            variant="outline"
            className="flex-1"
            href={`/manage/${booking.manageToken}`}
          >
            Manage booking
          </LinkButton>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Need to make a change? Use{" "}
          <Link
            href={`/manage/${booking.manageToken}`}
            className="font-medium text-primary hover:underline"
          >
            Manage booking
          </Link>{" "}
          to reschedule or cancel anytime.
        </p>
      </div>
    </div>
  )
}
