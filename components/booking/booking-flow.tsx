"use client"

import { useState } from "react"
import { useBrowserTimezone } from "@/hooks/use-browser-timezone"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Clock,
  Video,
  Phone,
  MapPin,
  FileText,
  ChevronLeft,
} from "lucide-react"
import { BookingCalendar } from "@/components/booking/booking-calendar"
import { TimeSlotList } from "@/components/booking/time-slot-list"
import { TimezoneSelect } from "@/components/booking/timezone-select"
import { BookingForm } from "@/components/booking/booking-form"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { getInitials } from "@/lib/utils"
import { getPublicSlots } from "@/actions/booking.actions"

const LOCATION_ICONS = {
  IN_PERSON: MapPin,
  PHONE_CALL: Phone,
  ONLINE_MEETING: Video,
  CUSTOM: FileText,
}

interface Props {
  orgSlug: string
  eventType: {
    id: string
    slug: string
    title: string
    description: string | null
    durationMinutes: number
    color: string
    locationType: "IN_PERSON" | "PHONE_CALL" | "ONLINE_MEETING" | "CUSTOM"
    locationValue: string | null
    questions: {
      id: string
      label: string
      type: "TEXT" | "TEXTAREA" | "PHONE"
      required: boolean
    }[]
  }
  host: { name: string; image: string | null }
}

export function BookingFlow({ orgSlug, eventType, host }: Props) {
  const router = useRouter()
  const [timezone, setTimezone] = useBrowserTimezone()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [step, setStep] = useState<"pick" | "details">("pick")
  const [slotRefreshKey, setSlotRefreshKey] = useState(0)

  const LocationIcon = LOCATION_ICONS[eventType.locationType]

  function handleSlotSelected(iso: string) {
    setSelectedSlot(iso)
    setStep("details")
  }

  function handleSuccess(bookingId: string) {
    router.push(`/book/${orgSlug}/${eventType.slug}/confirmation/${bookingId}`)
  }

  function handleSlotTaken() {
    setSelectedSlot(null)
    setStep("pick")
    setSlotRefreshKey((k) => k + 1)
  }

  return (
    <Card className="mx-auto max-w-4xl overflow-hidden">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-[280px_1fr]">
          <div className="border-b bg-muted/30 p-6 md:border-r md:border-b-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={host.image ?? undefined} />
              <AvatarFallback>{getInitials(host.name)}</AvatarFallback>
            </Avatar>
            <p className="mt-3 text-sm text-muted-foreground">{host.name}</p>
            <h1 className="mt-1 text-xl font-semibold">{eventType.title}</h1>
            {eventType.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {eventType.description}
              </p>
            )}

            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {eventType.durationMinutes} minutes
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <LocationIcon className="h-4 w-4" />
                {eventType.locationType === "ONLINE_MEETING"
                  ? "Online meeting"
                  : eventType.locationType === "PHONE_CALL"
                    ? "Phone call"
                    : eventType.locationValue ||
                      (eventType.locationType === "IN_PERSON"
                        ? "In-person"
                        : "Custom")}
              </p>
            </div>

            {step === "details" && selectedSlot && (
              <div className="mt-4 rounded-lg bg-primary/10 p-3 text-sm">
                <p className="font-medium text-primary">
                  {format(new Date(selectedSlot), "EEEE, MMMM d")}
                </p>
                <p className="text-muted-foreground">
                  {new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: timezone,
                  }).format(new Date(selectedSlot))}
                </p>
              </div>
            )}
          </div>

          <div className="p-6">
            {step === "pick" ? (
              <div className="space-y-4">
                <TimezoneSelect value={timezone} onChange={setTimezone} />
                <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
                  <BookingCalendar
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                  />
                  <div>
                    {selectedDate && (
                      <>
                        <p className="mb-3 text-sm font-medium">
                          {format(selectedDate, "EEEE, MMMM d")}
                        </p>
                        <TimeSlotList
                          key={slotRefreshKey}
                          queryKey={[
                            "public-slots",
                            orgSlug,
                            eventType.slug,
                            selectedDate.toDateString(),
                          ]}
                          fetchSlots={(s, e) =>
                            getPublicSlots(orgSlug, eventType.slug, s, e)
                          }
                          date={selectedDate}
                          timezone={timezone}
                          selectedSlot={selectedSlot}
                          onSelectSlot={handleSlotSelected}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("pick")}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <BookingForm
                  orgSlug={orgSlug}
                  eventSlug={eventType.slug}
                  eventTypeId={eventType.id}
                  startTimeISO={selectedSlot!}
                  timezone={timezone}
                  questions={eventType.questions}
                  onSuccess={handleSuccess}
                  onSlotTaken={handleSlotTaken}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
