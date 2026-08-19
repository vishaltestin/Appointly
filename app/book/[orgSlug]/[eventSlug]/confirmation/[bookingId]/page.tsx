import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Video,
  FileText,
} from "lucide-react"
import { db } from "@/lib/db"
import { generateICS } from "@/lib/ics"
import { AddToCalendarButton } from "@/components/booking/add-to-calendar-button"
import { Button } from "@/components/ui/button"

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
  const { bookingId } = await params

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { eventType: true },
  })
  if (!booking) notFound()

  const locationType = booking.eventType?.locationType ?? "ONLINE_MEETING"
  const LocationIcon = LOCATION_ICONS[locationType]

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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 dark:text-emerald-400" />
        <h1 className="mt-4 text-xl font-semibold">Booking confirmed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A confirmation has been sent to {booking.attendeeEmail}.
        </p>

        <div className="mt-6 space-y-2 rounded-lg bg-muted p-4 text-left text-sm">
          <p className="font-medium">{booking.eventTitle}</p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {format(booking.startTime, "EEEE, MMMM d · h:mm a")} (
            {booking.durationMinutes} min)
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <LocationIcon className="h-4 w-4" />
            {booking.eventType?.locationValue || "Details to follow"}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            with {booking.hostName}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <AddToCalendarButton
            icsContent={icsContent}
            filename={`${booking.eventTitle}.ics`}
          />
          <Button variant="outline" className="flex-1">
            <Link href={`/manage/${booking.manageToken}`}>Manage booking</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Need to reschedule? That capability is coming soon — for now, cancel
          and rebook a new time.
        </p>
      </div>
    </div>
  )
}
