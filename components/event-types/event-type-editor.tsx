"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EventTypeDetailsForm } from "@/components/event-types/event-type-details-form"
import { EventTypeAvailabilityForm } from "@/components/event-types/event-type-availability-form"
import { BookingQuestionsManager } from "@/components/event-types/booking-questions-manager"
import type {
  EventTypeDetailsInput,
  EventTypeAvailabilityInput,
} from "@/lib/validations/event-type.schema"

interface Props {
  orgSlug: string
  eventTypeId: string
  details: EventTypeDetailsInput
  availability: EventTypeAvailabilityInput
  schedules: { id: string; name: string; isDefault: boolean }[]
  questions: {
    id?: string
    label: string
    type: "TEXT" | "TEXTAREA" | "PHONE"
    required: boolean
  }[]
}

export function EventTypeEditor({
  orgSlug,
  eventTypeId,
  details,
  availability,
  schedules,
  questions,
}: Props) {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="questions">Booking questions</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="pt-6">
        <EventTypeDetailsForm
          orgSlug={orgSlug}
          eventTypeId={eventTypeId}
          defaultValues={details}
        />
      </TabsContent>
      <TabsContent value="availability" className="pt-6">
        <EventTypeAvailabilityForm
          orgSlug={orgSlug}
          eventTypeId={eventTypeId}
          defaultValues={availability}
          schedules={schedules}
        />
      </TabsContent>
      <TabsContent value="questions" className="pt-6">
        <BookingQuestionsManager
          orgSlug={orgSlug}
          eventTypeId={eventTypeId}
          initialQuestions={questions}
        />
      </TabsContent>
    </Tabs>
  )
}
