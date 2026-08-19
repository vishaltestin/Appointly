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
  CalendarClock,
} from "lucide-react"
import { db } from "@/lib/db"
import { generateICS } from "@/lib/ics"
import { AddToCalendarButton } from "@/components/booking/add-to-calendar-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

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

  const locationType = (booking.eventType?.locationType ?? "ONLINE_MEETING") as keyof typeof LOCATION_ICONS
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
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Appointly</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-6 pt-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <div>
              <h1 className="text-xl font-semibold">Booking confirmed</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                A confirmation has been sent to {booking.attendeeEmail}.
              </p>
            </div>

            <div className="space-y-2 rounded-lg bg-muted p-4 text-left text-sm">
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

            <div className="flex flex-col gap-2 sm:flex-row">
              <AddToCalendarButton
                icsContent={icsContent}
                filename={`${booking.eventTitle}.ics`}
              />
              <Button variant="outline" className="flex-1" render={<Link href={`/manage/${booking.manageToken}`} />}>
                Manage booking
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Need to reschedule? Use the manage link to cancel and rebook.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
