import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { ScheduleEditor } from "@/components/availability/schedule-editor"

export default async function ScheduleEditorPage({
  params,
}: {
  params: Promise<{ orgSlug: string; scheduleId: string }>
}) {
  const { orgSlug, scheduleId } = await params
  const membership = await requireOrgMembership(orgSlug)

  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
    include: { workingHours: true, dateOverrides: true },
  })

  if (!schedule || schedule.membershipId !== membership.id) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/${orgSlug}/availability`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to schedules
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {schedule.name}
        </h1>
      </div>

      <ScheduleEditor
        orgSlug={orgSlug}
        schedule={{
          id: schedule.id,
          name: schedule.name,
          timezone: schedule.timezone,
          bufferBefore: schedule.bufferBefore,
          bufferAfter: schedule.bufferAfter,
          workingHours: schedule.workingHours,
          dateOverrides: schedule.dateOverrides,
        }}
      />
    </div>
  )
}
