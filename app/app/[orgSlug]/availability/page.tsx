import { Clock } from "lucide-react"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { ensureDefaultSchedule } from "@/actions/availability.actions"
import { ScheduleCard } from "@/components/availability/schedule-card"
import { CreateScheduleDialog } from "@/components/availability/create-schedule-dialog"
import { EmptyState } from "@/components/shared/empty-state"

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)

  await ensureDefaultSchedule(orgSlug)

  const [schedules, unassignedEventTypes] = await Promise.all([
    db.schedule.findMany({
      where: { membershipId: membership.id },
      orderBy: { createdAt: "asc" },
      include: {
        workingHours: { orderBy: { dayOfWeek: "asc" } },
        _count: { select: { eventTypes: true } },
      },
    }),
    // Event types without an explicit schedule fall back to the default one
    // (see lib/booking-engine.ts), so count them against it.
    db.eventType.count({
      where: { membershipId: membership.id, scheduleId: null },
    }),
  ])

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  /** "Mon–Fri · 09:00–17:00", collapsing runs of days with identical hours. */
  function summarizeHours(
    hours: { dayOfWeek: number; startTime: string; endTime: string }[]
  ): string {
    if (hours.length === 0) return "Unavailable"
    // group consecutive days sharing the same window
    const runs: { from: number; to: number; start: string; end: string }[] = []
    for (const h of hours) {
      const last = runs[runs.length - 1]
      if (last && last.start === h.startTime && last.end === h.endTime && last.to === h.dayOfWeek - 1) {
        last.to = h.dayOfWeek
      } else {
        runs.push({ from: h.dayOfWeek, to: h.dayOfWeek, start: h.startTime, end: h.endTime })
      }
    }
    return runs
      .map(
        (r) =>
          `${r.from === r.to ? DAY_NAMES[r.from] : `${DAY_NAMES[r.from]}–${DAY_NAMES[r.to]}`} ${r.start}–${r.end}`
      )
      .join(" · ")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Availability
          </h1>
          <p className="text-sm text-muted-foreground">
            Define when you can be booked. Event types without their own
            schedule use the default.
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

      {schedules.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No schedules yet"
          description="Create a schedule to define the days and hours you can be booked."
        />
      ) : (
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
                summary: summarizeHours(schedule.workingHours),
                eventTypeCount:
                  schedule._count.eventTypes +
                  (schedule.isDefault ? unassignedEventTypes : 0),
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
