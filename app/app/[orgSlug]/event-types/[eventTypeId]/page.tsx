import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ExternalLink } from "lucide-react"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { EventTypeEditor } from "@/components/event-types/event-type-editor"
import { CopyLinkButton } from "@/components/event-types/copy-link-button"
import { Button } from "@/components/ui/button"

export default async function EventTypeEditorPage({
  params,
}: {
  params: Promise<{ orgSlug: string; eventTypeId: string }>
}) {
  const { orgSlug, eventTypeId } = await params
  const membership = await requireOrgMembership(orgSlug)

  const eventType = await db.eventType.findUnique({
    where: { id: eventTypeId },
    include: { questions: { orderBy: { order: "asc" } } },
  })
  if (!eventType || eventType.membershipId !== membership.id) notFound()

  const schedules = await db.schedule.findMany({
    where: { membershipId: membership.id },
    select: { id: true, name: true, isDefault: true },
  })

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${orgSlug}/${eventType.slug}`

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/${orgSlug}/event-types`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to event types
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {eventType.title}
          </h1>
          <div className="flex gap-2">
            <CopyLinkButton url={publicUrl} />
            <Button variant="outline" size="sm" render={<a href={publicUrl} target="_blank" rel="noreferrer" />}>
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      <EventTypeEditor
        orgSlug={orgSlug}
        eventTypeId={eventType.id}
        details={{
          title: eventType.title,
          slug: eventType.slug,
          description: eventType.description ?? "",
          durationMinutes: eventType.durationMinutes,
          color: eventType.color,
          locationType: eventType.locationType,
          locationValue: eventType.locationValue ?? "",
        }}
        availability={{
          scheduleId: eventType.scheduleId,
          bufferBeforeMinutes: eventType.bufferBeforeMinutes,
          bufferAfterMinutes: eventType.bufferAfterMinutes,
          minimumNoticeMinutes: eventType.minimumNoticeMinutes,
          slotIntervalMinutes: eventType.slotIntervalMinutes,
          maximumBookingsPerDay: eventType.maximumBookingsPerDay,
          requiresConfirmation: eventType.requiresConfirmation,
        }}
        schedules={schedules}
        questions={eventType.questions.map((q) => ({
          id: q.id,
          label: q.label,
          type: q.type,
          required: q.required,
        }))}
      />
    </div>
  )
}
