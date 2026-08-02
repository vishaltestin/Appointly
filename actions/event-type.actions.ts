"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { generateSlug } from "@/lib/utils"
import { ensureDefaultScheduleForMembership } from "@/lib/schedule-bootstrap"
import {
  createEventTypeSchema,
  eventTypeDetailsSchema,
  eventTypeAvailabilitySchema,
  updateBookingQuestionsSchema,
  type CreateEventTypeInput,
  type EventTypeDetailsInput,
  type EventTypeAvailabilityInput,
  type UpdateBookingQuestionsInput,
} from "@/lib/validations/event-type.schema"

async function getOwnedEventType(orgSlug: string, eventTypeId: string) {
  const membership = await requireOrgMembership(orgSlug)
  const eventType = await db.eventType.findUnique({
    where: { id: eventTypeId },
  })
  if (!eventType || eventType.membershipId !== membership.id) {
    return { membership, eventType: null as null }
  }
  return { membership, eventType }
}

export async function createEventType(
  orgSlug: string,
  values: CreateEventTypeInput
) {
  const membership = await requireOrgMembership(orgSlug)
  const parsed = createEventTypeSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid title." }

  // Guarantees this event type is bookable the moment it's created — see
  // Module 5 notes on why this can't be skipped.
  await ensureDefaultScheduleForMembership(membership)

  const slug = await generateUniqueEventSlug(
    membership.organizationId,
    parsed.data.title
  )

  const eventType = await db.eventType.create({
    data: {
      membershipId: membership.id,
      organizationId: membership.organizationId,
      title: parsed.data.title,
      slug,
    },
  })

  revalidatePath(`/app/${orgSlug}/event-types`)
  return { success: "Event type created.", eventTypeId: eventType.id }
}

export async function updateEventTypeDetails(
  orgSlug: string,
  eventTypeId: string,
  values: EventTypeDetailsInput
) {
  const { membership, eventType } = await getOwnedEventType(
    orgSlug,
    eventTypeId
  )
  if (!eventType) return { error: "Event type not found." }

  const parsed = eventTypeDetailsSchema.safeParse(values)
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid fields." }

  if (parsed.data.slug !== eventType.slug) {
    const existing = await db.eventType.findUnique({
      where: {
        organizationId_slug: {
          organizationId: membership.organizationId,
          slug: parsed.data.slug,
        },
      },
    })
    if (existing)
      return { error: "This URL is already used by another event type." }
  }

  await db.eventType.update({
    where: { id: eventTypeId },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      durationMinutes: parsed.data.durationMinutes,
      color: parsed.data.color,
      locationType: parsed.data.locationType,
      locationValue: parsed.data.locationValue || null,
    },
  })

  revalidatePath(`/app/${orgSlug}/event-types/${eventTypeId}`)
  return { success: "Event type updated.", slug: parsed.data.slug }
}

export async function updateEventTypeAvailability(
  orgSlug: string,
  eventTypeId: string,
  values: EventTypeAvailabilityInput
) {
  const { membership, eventType } = await getOwnedEventType(
    orgSlug,
    eventTypeId
  )
  if (!eventType) return { error: "Event type not found." }

  const parsed = eventTypeAvailabilitySchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid availability settings." }

  if (parsed.data.scheduleId) {
    const schedule = await db.schedule.findUnique({
      where: { id: parsed.data.scheduleId },
    })
    if (!schedule || schedule.membershipId !== membership.id) {
      return { error: "Invalid schedule selected." }
    }
  }

  await db.eventType.update({ where: { id: eventTypeId }, data: parsed.data })

  revalidatePath(`/app/${orgSlug}/event-types/${eventTypeId}`)
  return { success: "Availability settings updated." }
}

/**
 * Known limitation: this replaces all questions rather than diffing, so
 * question IDs change on every save. Past bookings' `responses` (keyed by
 * the old IDs) remain intact in the database but won't automatically
 * re-match new IDs going forward. Acceptable for now — a detailed
 * per-booking response view is planned alongside Module 6.
 */
export async function updateBookingQuestions(
  orgSlug: string,
  eventTypeId: string,
  values: UpdateBookingQuestionsInput
) {
  const { eventType } = await getOwnedEventType(orgSlug, eventTypeId)
  if (!eventType) return { error: "Event type not found." }

  const parsed = updateBookingQuestionsSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid questions." }

  await db.$transaction([
    db.bookingQuestion.deleteMany({ where: { eventTypeId } }),
    db.bookingQuestion.createMany({
      data: parsed.data.questions.map((q, index) => ({
        eventTypeId,
        label: q.label,
        type: q.type,
        required: q.required,
        order: index,
      })),
    }),
  ])

  revalidatePath(`/app/${orgSlug}/event-types/${eventTypeId}`)
  return { success: "Booking questions saved." }
}

export async function toggleEventTypeActive(
  orgSlug: string,
  eventTypeId: string,
  isActive: boolean
) {
  const { eventType } = await getOwnedEventType(orgSlug, eventTypeId)
  if (!eventType) return { error: "Event type not found." }

  await db.eventType.update({ where: { id: eventTypeId }, data: { isActive } })
  revalidatePath(`/app/${orgSlug}/event-types`)
  return {
    success: isActive ? "Event type activated." : "Event type deactivated.",
  }
}

export async function deleteEventType(orgSlug: string, eventTypeId: string) {
  const { eventType } = await getOwnedEventType(orgSlug, eventTypeId)
  if (!eventType) return { error: "Event type not found." }

  // Past bookings survive this via eventTypeId's onDelete: SetNull + the
  // snapshotted eventTitle/durationMinutes fields on Booking.
  await db.eventType.delete({ where: { id: eventTypeId } })
  revalidatePath(`/app/${orgSlug}/event-types`)
  return { success: "Event type deleted." }
}

async function generateUniqueEventSlug(organizationId: string, title: string) {
  const base = generateSlug(title) || "meeting"
  let slug = base
  let suffix = 1
  while (
    await db.eventType.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    })
  ) {
    slug = `${base}-${suffix++}`
  }
  return slug
}
