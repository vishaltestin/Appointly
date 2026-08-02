import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { ensureDefaultSchedule } from "@/actions/availability.actions"
import { ScheduleCard } from "@/components/availability/schedule-card"
import { CreateScheduleDialog } from "@/components/availability/create-schedule-dialog"

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)

  await ensureDefaultSchedule(orgSlug)

  const schedules = await db.schedule.findMany({
    where: { membershipId: membership.id },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Availability
          </h1>
          <p className="text-sm text-muted-foreground">
            Define when you can be booked. You&apos;ll assign schedules to
            services next.
          </p>
        </div>
        <CreateScheduleDialog
          orgSlug={orgSlug}
          existingSchedules={schedules.map((s) => ({ id: s.id, name: s.name }))}
          defaultTimezone={
            membership.user.timezone || membership.organization.timezone
          }
        />
      </div>

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            orgSlug={orgSlug}
            schedule={{
              id: schedule.id,
              name: schedule.name,
              timezone: schedule.timezone,
              isDefault: schedule.isDefault,
            }}
          />
        ))}
      </div>
    </div>
  )
}
