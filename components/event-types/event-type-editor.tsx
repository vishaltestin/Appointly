"use client"

import { Clock, FileText, ListChecks } from "lucide-react"
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

const SECTIONS = [
  {
    value: "details",
    label: "Details",
    icon: FileText,
    title: "Event details",
    description: "What attendees see on your public booking page.",
  },
  {
    value: "availability",
    label: "Availability",
    icon: Clock,
    title: "Availability rules",
    description:
      "Which schedule feeds this event, plus buffers, notice and daily limits.",
  },
  {
    value: "questions",
    label: "Booking questions",
    icon: ListChecks,
    title: "Booking questions",
    description: "Extra questions attendees answer before their slot is confirmed.",
  },
] as const

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
        {SECTIONS.map((section) => (
          <TabsTrigger key={section.value} value={section.value}>
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="details" className="pt-6">
        <SectionCard section={SECTIONS[0]}>
          <EventTypeDetailsForm
            orgSlug={orgSlug}
            eventTypeId={eventTypeId}
            defaultValues={details}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="availability" className="pt-6">
        <SectionCard section={SECTIONS[1]}>
          <EventTypeAvailabilityForm
            orgSlug={orgSlug}
            eventTypeId={eventTypeId}
            defaultValues={availability}
            schedules={schedules}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="questions" className="pt-6">
        <SectionCard section={SECTIONS[2]}>
          <BookingQuestionsManager
            orgSlug={orgSlug}
            eventTypeId={eventTypeId}
            initialQuestions={questions}
          />
        </SectionCard>
      </TabsContent>
    </Tabs>
  )
}

function SectionCard({
  section,
  children,
}: {
  section: (typeof SECTIONS)[number]
  children: React.ReactNode
}) {
  return (
    <section className="w-full overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]">
      <header className="flex items-center gap-3.5 border-b bg-muted/30 px-6 py-5 sm:px-8">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <section.icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            {section.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {section.description}
          </p>
        </div>
      </header>
      <div className="px-6 py-6 sm:px-8 sm:py-8">{children}</div>
    </section>
  )
}
