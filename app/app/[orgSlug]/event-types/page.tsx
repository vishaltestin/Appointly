import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { CreateEventTypeDialog } from "@/components/event-types/create-event-type-dialog"
import { EventTypeCard } from "@/components/event-types/event-type-card"

export default async function EventTypesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)

  const eventTypes = await db.eventType.findMany({
    where: { membershipId: membership.id },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Event types</h1>
          <p className="text-sm text-muted-foreground">
            Create bookable links to share with your clients.
          </p>
        </div>
        <CreateEventTypeDialog orgSlug={orgSlug} />
      </div>

      {eventTypes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t created any event types yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventTypes.map((et) => (
            <EventTypeCard
              key={et.id}
              orgSlug={orgSlug}
              eventType={{
                id: et.id,
                title: et.title,
                slug: et.slug,
                durationMinutes: et.durationMinutes,
                color: et.color,
                isActive: et.isActive,
                requiresConfirmation: et.requiresConfirmation
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
