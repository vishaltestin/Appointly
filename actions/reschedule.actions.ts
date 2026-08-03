"use server"

import { Prisma, type Booking, type EventType } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { getEventTypeSlots } from "@/lib/booking-engine"
import { generateSecureToken } from "@/lib/tokens"
import { sendBookingRescheduledEmail } from "@/lib/mail"

interface ValidationSuccess {
  booking: Booking
  eventType: EventType
}
interface ValidationError {
  error: string
}

function isError(
  result: ValidationSuccess | ValidationError
): result is ValidationError {
  return "error" in result
}

/**
 * Scope decision: only CONFIRMED bookings can be rescheduled. A PENDING
 * booking should be cancelled/withdrawn and rebooked, or approved first —
 * rescheduling doesn't re-trigger host approval, so allowing it on PENDING
 * bookings would let an unapproved request silently move to a new time.
 */
async function validateReschedulable(
  bookingId: string
): Promise<ValidationSuccess | ValidationError> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { eventType: true },
  })
  if (!booking) return { error: "Booking not found." }
  if (booking.status !== "CONFIRMED")
    return { error: "Only confirmed bookings can be rescheduled." }
  if (booking.startTime < new Date())
    return { error: "Past bookings can't be rescheduled." }
  if (!booking.eventType) {
    return {
      error:
        "This booking's event type no longer exists, so it can't be automatically rescheduled. Please contact the host directly.",
    }
  }
  return { booking, eventType: booking.eventType }
}

// ---------------------------------------------------------------------------
// Slot lookups
// ---------------------------------------------------------------------------

/**
 * Host-authenticated slot lookup. Deliberately bypasses the public
 * "isActive" / org-suspended gates that `getPublicSlots` applies — a host
 * should be able to reschedule an existing booking even if they've
 * temporarily hidden the event type from new bookers.
 */
export async function getHostRescheduleSlots(
  orgSlug: string,
  bookingId: string,
  rangeStartISO: string,
  rangeEndISO: string
) {
  const membership = await requireOrgMembership(orgSlug)
  const result = await validateReschedulable(bookingId)
  if (isError(result)) return result
  if (result.booking.hostMembershipId !== membership.id) {
    return { error: "You don't have permission to reschedule this booking." }
  }

  const slots = await getEventTypeSlots({
    // Uses the event type's *current* schedule/buffers/notice settings, but
    // the *original* booking's duration — see Module 6 notes.
    eventType: {
      ...result.eventType,
      durationMinutes: result.booking.durationMinutes,
    },
    rangeStart: new Date(rangeStartISO),
    rangeEnd: new Date(rangeEndISO),
    excludeBookingId: result.booking.id,
  })
  if ("error" in slots) return slots
  return {
    slots: slots.slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
    timezone: slots.timezone,
  }
}

/** No auth — the manageToken itself is the authorization boundary. */
export async function getAttendeeRescheduleSlots(
  manageToken: string,
  rangeStartISO: string,
  rangeEndISO: string
) {
  const booking = await db.booking.findUnique({ where: { manageToken } })
  if (!booking) return { error: "This booking link is invalid." }

  const result = await validateReschedulable(booking.id)
  if (isError(result)) return result
  if (!result.eventType.isActive) {
    return {
      error:
        "Rescheduling isn't available right now. Please contact the host directly.",
    }
  }

  const slots = await getEventTypeSlots({
    eventType: {
      ...result.eventType,
      durationMinutes: result.booking.durationMinutes,
    },
    rangeStart: new Date(rangeStartISO),
    rangeEnd: new Date(rangeEndISO),
    excludeBookingId: result.booking.id,
  })
  if ("error" in slots) return slots
  return {
    slots: slots.slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
    timezone: slots.timezone,
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function rescheduleBookingAsHost(
  orgSlug: string,
  bookingId: string,
  newStartTimeISO: string
) {
  const membership = await requireOrgMembership(orgSlug)
  const result = await validateReschedulable(bookingId)
  if (isError(result)) return result
  if (result.booking.hostMembershipId !== membership.id) {
    return { error: "You don't have permission to reschedule this booking." }
  }

  return performReschedule(
    result.booking,
    result.eventType,
    new Date(newStartTimeISO),
    "HOST"
  )
}

export async function rescheduleBookingAsAttendee(
  manageToken: string,
  newStartTimeISO: string
) {
  const existing = await db.booking.findUnique({ where: { manageToken } })
  if (!existing) return { error: "This booking link is invalid." }

  const result = await validateReschedulable(existing.id)
  if (isError(result)) return result

  return performReschedule(
    result.booking,
    result.eventType,
    new Date(newStartTimeISO),
    "ATTENDEE"
  )
}

async function performReschedule(
  booking: Booking,
  eventType: EventType,
  newStartTime: Date,
  initiatedBy: "HOST" | "ATTENDEE"
) {
  const newEndTime = new Date(
    newStartTime.getTime() + booking.durationMinutes * 60_000
  )

  // Slots shown could be stale by submission time — re-verify before writing.
  const check = await getEventTypeSlots({
    eventType: { ...eventType, durationMinutes: booking.durationMinutes },
    rangeStart: newStartTime,
    rangeEnd: newEndTime,
    excludeBookingId: booking.id,
  })
  if ("error" in check) return check
  const stillAvailable = check.slots.some(
    (s) => s.start.getTime() === newStartTime.getTime()
  )
  if (!stillAvailable) {
    return {
      error: "Sorry, that time was just booked. Please pick another.",
      slotTaken: true,
    }
  }

  const newManageToken = generateSecureToken()

  try {
    const newBooking = await db.$transaction(
      async (tx) => {
        const conflict = await tx.booking.findFirst({
          where: {
            hostMembershipId: booking.hostMembershipId,
            status: { in: ["CONFIRMED", "PENDING"] },
            id: { not: booking.id },
            startTime: { lt: newEndTime },
            endTime: { gt: newStartTime },
          },
        })
        if (conflict) throw new Error("SLOT_TAKEN")

        const created = await tx.booking.create({
          data: {
            organizationId: booking.organizationId,
            eventTypeId: booking.eventTypeId,
            eventTitle: booking.eventTitle,
            durationMinutes: booking.durationMinutes,
            hostMembershipId: booking.hostMembershipId,
            hostName: booking.hostName,
            hostEmail: booking.hostEmail,
            hostTimezone: booking.hostTimezone,
            attendeeName: booking.attendeeName,
            attendeeEmail: booking.attendeeEmail,
            attendeeTimezone: booking.attendeeTimezone,
            attendeeNotes: booking.attendeeNotes,
            responses:
              booking.responses === null
                ? undefined
                : (booking.responses as Prisma.InputJsonValue),
            startTime: newStartTime,
            endTime: newEndTime,
            status: "CONFIRMED",
            manageToken: newManageToken,
            rescheduledFromId: booking.id,
            customerId: booking.customerId,
          },
        })

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledBy: initiatedBy,
            cancellationReason: `Rescheduled to ${newStartTime.toISOString()}`,
          },
        })

        return created
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    const notifyEmail =
      initiatedBy === "HOST" ? booking.attendeeEmail : booking.hostEmail
    const counterpartName =
      initiatedBy === "HOST" ? booking.attendeeName : booking.hostName

    await sendBookingRescheduledEmail({
      to: notifyEmail,
      eventTitle: booking.eventTitle,
      counterpartName,
      oldStartTime: booking.startTime,
      newStartTime,
      manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${newManageToken}`,
    })

    return { success: true, newBookingId: newBooking.id, newManageToken }
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return {
        error: "Sorry, that time was just booked. Please pick another.",
        slotTaken: true,
      }
    }
    throw err
  }
}
