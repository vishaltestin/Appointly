import { CalendarPlus } from "lucide-react"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { canCreateEventType } from "@/lib/usage"
import { CreateEventTypeDialog } from "@/components/event-types/create-event-type-dialog"
import { EventTypeCard } from "@/components/event-types/event-type-card"
import { UpgradeNotice } from "@/components/billing/upgrade-notice"
import { EmptyState } from "@/components/shared/empty-state"

export default async function EventTypesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)

  const [eventTypes, limitCheck] = await Promise.all([
    db.eventType.findMany({
      where: { membershipId: membership.id },
      orderBy: { createdAt: "asc" },
    }),
    canCreateEventType(membership.organizationId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Event types</h1>
          <p className="text-sm text-muted-foreground">
            Create bookable links to share with your clients.
          </p>
        </div>
        {/* Full-width CTA on mobile: thumb-reach and clear of the heading. */}
        <div className="sm:contents [&_button]:w-full sm:[&_button]:w-auto">
          <CreateEventTypeDialog
            orgSlug={orgSlug}
            disabled={!limitCheck.allowed}
          />
        </div>
      </div>

      {!limitCheck.allowed && (
        <UpgradeNotice orgSlug={orgSlug} message={limitCheck.error!} />
      )}

      {eventTypes.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No event types yet"
          description="Create your first event type to get a bookable link you can share with clients."
        />
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
                requiresConfirmation: et.requiresConfirmation,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
