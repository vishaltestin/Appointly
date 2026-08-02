"use server"

import { addDays } from "date-fns"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { DEFAULT_WORKING_HOURS, getAvailableSlots } from "@/lib/availability"
import {
  createScheduleSchema,
  updateScheduleDetailsSchema,
  updateWorkingHoursSchema,
  dateOverrideSchema,
  type CreateScheduleInput,
  type UpdateScheduleDetailsInput,
  type UpdateWorkingHoursInput,
  type DateOverrideInput,
} from "@/lib/validations/availability.schema"
import { ensureDefaultScheduleForMembership } from "@/lib/schedule-bootstrap"

/**
 * Scope note: schedules are self-managed only. A member manages their own
 * availability within an org. Admin-managed "set hours for a teammate" is a
 * reasonable future extension, intentionally out of scope here.
 */
async function getOwnedSchedule(orgSlug: string, scheduleId: string) {
  const membership = await requireOrgMembership(orgSlug)
  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } })
  if (!schedule || schedule.membershipId !== membership.id) {
    return { membership, schedule: null as null }
  }
  return { membership, schedule }
}

/** Called lazily the first time a member visits /availability with zero schedules. */
export async function ensureDefaultSchedule(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)
  await ensureDefaultScheduleForMembership(membership)
}

export async function createSchedule(
  orgSlug: string,
  values: CreateScheduleInput
) {
  const membership = await requireOrgMembership(orgSlug)
  const parsed = createScheduleSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid schedule details." }

  const { name, timezone, copyFromScheduleId } = parsed.data
  const existingCount = await db.schedule.count({
    where: { membershipId: membership.id },
  })

  let hoursToCreate = DEFAULT_WORKING_HOURS.map((h) => ({ ...h }))
  if (copyFromScheduleId) {
    const source = await db.schedule.findFirst({
      where: { id: copyFromScheduleId, membershipId: membership.id },
      include: { workingHours: true },
    })
    if (source) {
      hoursToCreate = source.workingHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
      }))
    }
  }

  const schedule = await db.schedule.create({
    data: {
      membershipId: membership.id,
      name,
      timezone,
      isDefault: existingCount === 0,
      workingHours: { create: hoursToCreate },
    },
  })

  revalidatePath(`/app/${orgSlug}/availability`)
  return { success: "Schedule created.", scheduleId: schedule.id }
}

export async function updateScheduleDetails(
  orgSlug: string,
  scheduleId: string,
  values: UpdateScheduleDetailsInput
) {
  const { schedule } = await getOwnedSchedule(orgSlug, scheduleId)
  if (!schedule) return { error: "Schedule not found." }

  const parsed = updateScheduleDetailsSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid schedule details." }

  await db.schedule.update({
    where: { id: scheduleId },
    data: {
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      bufferBefore: parsed.data.bufferBeforeMinutes,
      bufferAfter: parsed.data.bufferAfterMinutes,
    },
  })

  revalidatePath(`/app/${orgSlug}/availability/${scheduleId}`)
  return { success: "Schedule updated." }
}

export async function updateWorkingHours(
  orgSlug: string,
  scheduleId: string,
  values: UpdateWorkingHoursInput
) {
  const { schedule } = await getOwnedSchedule(orgSlug, scheduleId)
  if (!schedule) return { error: "Schedule not found." }

  const parsed = updateWorkingHoursSchema.safeParse(values)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid working hours.",
    }
  }

  const flatRows = parsed.data.days.flatMap((day) =>
    day.ranges.map((range) => ({
      scheduleId,
      dayOfWeek: day.dayOfWeek,
      startTime: range.startTime,
      endTime: range.endTime,
    }))
  )

  await db.$transaction([
    db.workingHours.deleteMany({ where: { scheduleId } }),
    db.workingHours.createMany({ data: flatRows }),
  ])

  revalidatePath(`/app/${orgSlug}/availability/${scheduleId}`)
  return { success: "Working hours saved." }
}

export async function setDefaultSchedule(orgSlug: string, scheduleId: string) {
  const { membership, schedule } = await getOwnedSchedule(orgSlug, scheduleId)
  if (!schedule) return { error: "Schedule not found." }

  await db.$transaction([
    db.schedule.updateMany({
      where: { membershipId: membership.id },
      data: { isDefault: false },
    }),
    db.schedule.update({
      where: { id: scheduleId },
      data: { isDefault: true },
    }),
  ])

  revalidatePath(`/app/${orgSlug}/availability`)
  return { success: "Default schedule updated." }
}

export async function deleteSchedule(orgSlug: string, scheduleId: string) {
  const { membership, schedule } = await getOwnedSchedule(orgSlug, scheduleId)
  if (!schedule) return { error: "Schedule not found." }

  const totalSchedules = await db.schedule.count({
    where: { membershipId: membership.id },
  })
  if (totalSchedules <= 1) {
    return { error: "You must have at least one availability schedule." }
  }

  // TODO(Module 5): once event types reference a schedule, block deletion
  // here (or reassign affected event types) instead of allowing it freely.

  await db.schedule.delete({ where: { id: scheduleId } })

  if (schedule.isDefault) {
    const nextSchedule = await db.schedule.findFirst({
      where: { membershipId: membership.id },
      orderBy: { createdAt: "asc" },
    })
    if (nextSchedule) {
      await db.schedule.update({
        where: { id: nextSchedule.id },
        data: { isDefault: true },
      })
    }
  }

  revalidatePath(`/app/${orgSlug}/availability`)
  return { success: "Schedule deleted." }
}

export async function addDateOverride(
  orgSlug: string,
  scheduleId: string,
  values: DateOverrideInput
) {
  const { schedule } = await getOwnedSchedule(orgSlug, scheduleId)
  if (!schedule) return { error: "Schedule not found." }

  const parsed = dateOverrideSchema.safeParse(values)
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid override." }

  const { date, type, startTime, endTime, reason } = parsed.data

  await db.dateOverride.upsert({
    where: { scheduleId_date: { scheduleId, date } },
    create: { scheduleId, date, type, startTime, endTime, reason },
    update: { type, startTime, endTime, reason },
  })

  revalidatePath(`/app/${orgSlug}/availability/${scheduleId}`)
  return { success: "Date override saved." }
}

export async function removeDateOverride(
  orgSlug: string,
  scheduleId: string,
  overrideId: string
) {
  const { schedule } = await getOwnedSchedule(orgSlug, scheduleId)
  if (!schedule) return { error: "Schedule not found." }

  await db.dateOverride.delete({ where: { id: overrideId } })
  revalidatePath(`/app/${orgSlug}/availability/${scheduleId}`)
  return { success: "Date override removed." }
}

/**
 * Powers <AvailabilityPreview>. No bookings exist yet (Module 5/6), so this
 * is illustrative only — based purely on working hours, overrides, and
 * buffers, using a fixed 30-minute duration for display purposes.
 */
export async function getSchedulePreview(orgSlug: string, scheduleId: string) {
  const { schedule } = await getOwnedSchedule(orgSlug, scheduleId)
  if (!schedule) return { error: "Schedule not found." }

  const full = await db.schedule.findUnique({
    where: { id: scheduleId },
    include: { workingHours: true, dateOverrides: true },
  })
  if (!full) return { error: "Schedule not found." }

  const rangeStart = new Date()
  const rangeEnd = addDays(rangeStart, 7)

  const slots = getAvailableSlots({
    timezone: full.timezone,
    workingHours: full.workingHours,
    dateOverrides: full.dateOverrides,
    durationMinutes: 30,
    bufferBeforeMinutes: full.bufferBefore,
    bufferAfterMinutes: full.bufferAfter,
    rangeStart,
    rangeEnd,
  })

  return { slots, timezone: full.timezone }
}
