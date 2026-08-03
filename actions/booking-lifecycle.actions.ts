"use server"

import { revalidatePath } from "next/cache"
import {
  Prisma,
  type Booking,
  type EventType,
} from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import { getEventTypeSlots } from "@/lib/booking-engine"
import { generateSecureToken } from "@/lib/tokens"
import {
  onBookingApproved,
  onBookingCancelled,
} from "@/lib/customer-counters"
import {
  sendBookingApprovedEmail,
  sendBookingCancellationEmail,
  sendBookingDeclinedEmail,
  sendBookingRescheduledEmail,
} from "@/lib/mail"
import {
  cancelBookingSchema,
  type CancelBookingInput,
} from "@/lib/validations/booking-management.schema"

/**
 * The single canonical module for everything that happens to a booking after
 * it's created: cancel, approve, decline, reschedule — for both the
 * authenticated host and the token-bearing attendee.
 *
 * This replaces three overlapping modules that each exported some of these
 * names (booking-management / booking-approval / booking-public-lifecycle /
 * reschedule). Only one of them updated customer counters, and it wasn't the
 * one wired to the UI, so the CRM numbers drifted on every cancellation.
 *
 * Rules that apply throughout:
 *  - The host path authenticates via requireOrgMembership + host ownership.
 *  - The attendee path has no session; the unguessable `manageToken` IS the
 *    authorization boundary.
 *  - Any write that touches booking status also updates customer counters,
 *    inside the same transaction.
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type RescheduleResult =
  | {
      error: string
      slotTaken?: boolean
      success?: undefined
      newBookingId?: undefined
      newManageToken?: undefined
    }
  | {
      error?: undefined
      success: string
      newBookingId: string
      newManageToken: string
    }

export type SlotsResult =
  | { error: string; slots?: undefined; timezone?: undefined }
  | {
      error?: undefined
      slots: { start: string; end: string }[]
      timezone: string
    }

type ActionResult =
  | { error: string; success?: undefined }
  | { error?: undefined; success: string }

type OrgMembership = Awaited<ReturnType<typeof requireOrgMembership>>

/**
 * Explicitly annotated (rather than inferred) so `"error" in result` narrows
 * cleanly at every call site — inference would widen each branch with
 * optional `?: undefined` members and defeat the check.
 */
type ManageableBooking =
  | { error: string; booking?: undefined; membership?: undefined }
  | { error?: undefined; booking: Booking; membership: OrgMembership }

/** Type predicate — narrows both `booking` and `membership` in one check. */
function isDenied(
  result: ManageableBooking
): result is { error: string; booking?: undefined; membership?: undefined } {
  return result.error !== undefined
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

/**
 * Loads a booking and confirms the caller may act on it.
 *
 * ADMIN/OWNER can manage any booking in their workspace (that's what
 * `canManageAllBookings` was always meant to express); a MEMBER can only
 * manage bookings they host.
 */
async function requireManageableBooking(
  orgSlug: string,
  bookingId: string
): Promise<ManageableBooking> {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })

  if (!booking || booking.organizationId !== membership.organizationId) {
    return { error: "Booking not found." }
  }

  const isHost = booking.hostMembershipId === membership.id
  const canManageAll = permissions.canManageAllBookings(membership.role)

  if (!isHost && !canManageAll) {
    return { error: "You don't have permission to manage this booking." }
  }

  return { booking, membership }
}

function revalidateBooking(orgSlug: string, bookingId: string) {
  revalidatePath(`/app/${orgSlug}/bookings`)
  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  revalidatePath(`/app/${orgSlug}/dashboard`)
  revalidatePath(`/app/${orgSlug}/customers`)
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

/**
 * Writes the cancellation and adjusts customer counters atomically.
 * `previousStatus` is captured before the update so the counter helper knows
 * whether a CONFIRMED slot is being released.
 */
async function writeCancellation(
  booking: Pick<Booking, "id" | "status" | "customerId">,
  cancelledBy: "HOST" | "ATTENDEE",
  reason: string | null
) {
  const previousStatus = booking.status

  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy,
        cancellationReason: reason,
      },
    })

    await onBookingCancelled(tx, booking.customerId, previousStatus)
  })
}

export async function cancelBookingAsHost(
  orgSlug: string,
  bookingId: string,
  values: CancelBookingInput
): Promise<ActionResult> {
  const found = await requireManageableBooking(orgSlug, bookingId)
  if (isDenied(found)) return { error: found.error }
  const { booking } = found

  const parsed = cancelBookingSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid cancellation details." }

  if (booking.status === "CANCELLED")
    return { error: "This booking is already cancelled." }
  if (booking.startTime < new Date())
    return { error: "Past bookings can't be cancelled." }

  await writeCancellation(booking, "HOST", parsed.data.reason || null)

  await sendBookingCancellationEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    startTime: booking.startTime,
    cancelledByLabel: booking.hostName,
    reason: parsed.data.reason || undefined,
  })

  revalidateBooking(orgSlug, bookingId)
  return { success: "Booking cancelled." }
}

/** No session — the unguessable manageToken is the authorization boundary. */
export async function cancelBookingAsAttendee(
  manageToken: string,
  values: CancelBookingInput
): Promise<ActionResult> {
  const booking = await db.booking.findUnique({ where: { manageToken } })
  if (!booking) return { error: "This booking link is invalid." }

  const parsed = cancelBookingSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid cancellation details." }

  if (booking.status === "CANCELLED")
    return { error: "This booking is already cancelled." }
  if (booking.startTime < new Date())
    return { error: "Past bookings can't be cancelled." }

  await writeCancellation(booking, "ATTENDEE", parsed.data.reason || null)

  await sendBookingCancellationEmail({
    to: booking.hostEmail,
    eventTitle: booking.eventTitle,
    startTime: booking.startTime,
    cancelledByLabel: booking.attendeeName,
    reason: parsed.data.reason || undefined,
  })

  return { success: "Booking cancelled." }
}

// ---------------------------------------------------------------------------
// Approve / decline (requiresConfirmation event types)
// ---------------------------------------------------------------------------

export async function approveBooking(
  orgSlug: string,
  bookingId: string
): Promise<ActionResult> {
  const found = await requireManageableBooking(orgSlug, bookingId)
  if (isDenied(found)) return { error: found.error }
  const { booking } = found

  if (booking.status !== "PENDING")
    return { error: "Only pending bookings can be approved." }

  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
    })
    await onBookingApproved(tx, booking.customerId)
  })

  await sendBookingApprovedEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    hostName: booking.hostName,
    startTime: booking.startTime,
    manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.manageToken}`,
  })

  revalidateBooking(orgSlug, bookingId)
  return { success: "Booking approved." }
}

/**
 * Declining is stored as CANCELLED + cancelledBy: HOST — there's no separate
 * DECLINED status, by schema design. The attendee gets the decline email
 * rather than the generic cancellation one.
 */
export async function declineBooking(
  orgSlug: string,
  bookingId: string,
  values: CancelBookingInput
): Promise<ActionResult> {
  const found = await requireManageableBooking(orgSlug, bookingId)
  if (isDenied(found)) return { error: found.error }
  const { booking } = found

  if (booking.status !== "PENDING")
    return { error: "Only pending bookings can be declined." }

  const parsed = cancelBookingSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid details." }

  await writeCancellation(booking, "HOST", parsed.data.reason || null)

  await sendBookingDeclinedEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    hostName: booking.hostName,
    startTime: booking.startTime,
    reason: parsed.data.reason || undefined,
  })

  revalidateBooking(orgSlug, bookingId)
  return { success: "Booking declined." }
}

// ---------------------------------------------------------------------------
// Reschedule
// ---------------------------------------------------------------------------

interface ReschedulableSuccess {
  booking: Booking
  eventType: EventType
}

/**
 * Scope decision: only CONFIRMED bookings can be rescheduled. A PENDING
 * booking should be approved or withdrawn first — rescheduling doesn't
 * re-trigger host approval, so allowing it would let an unapproved request
 * silently move to a new time.
 */
async function validateReschedulable(
  bookingId: string
): Promise<ReschedulableSuccess | { error: string }> {
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

function serializeSlots(result: {
  slots: { start: Date; end: Date }[]
  timezone: string
}): SlotsResult {
  return {
    slots: result.slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
    timezone: result.timezone,
  }
}

/**
 * Host-authenticated slot lookup. Deliberately bypasses the public `isActive`
 * gate that `getPublicSlots` applies — a host should be able to reschedule an
 * existing booking even if they've temporarily hidden the event type from
 * new bookers.
 */
export async function getHostRescheduleSlots(
  orgSlug: string,
  bookingId: string,
  rangeStartISO: string,
  rangeEndISO: string
): Promise<SlotsResult> {
  const found = await requireManageableBooking(orgSlug, bookingId)
  if (isDenied(found)) return { error: found.error }

  const result = await validateReschedulable(bookingId)
  if ("error" in result) return result

  const slots = await getEventTypeSlots({
    // Current schedule/buffers/notice settings, but the ORIGINAL booking's
    // duration — changing an event type's length later must not silently
    // resize bookings already on the calendar.
    eventType: {
      ...result.eventType,
      durationMinutes: result.booking.durationMinutes,
    },
    rangeStart: new Date(rangeStartISO),
    rangeEnd: new Date(rangeEndISO),
    excludeBookingId: result.booking.id,
  })
  if ("error" in slots) return slots

  return serializeSlots(slots)
}

/** No session — the manageToken is the authorization boundary. */
export async function getAttendeeRescheduleSlots(
  manageToken: string,
  rangeStartISO: string,
  rangeEndISO: string
): Promise<SlotsResult> {
  const booking = await db.booking.findUnique({ where: { manageToken } })
  if (!booking) return { error: "This booking link is invalid." }

  const result = await validateReschedulable(booking.id)
  if ("error" in result) return result

  // Attendees, unlike hosts, are held to the public isActive gate.
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

  return serializeSlots(slots)
}

export async function rescheduleBookingAsHost(
  orgSlug: string,
  bookingId: string,
  newStartTimeISO: string
): Promise<RescheduleResult> {
  const found = await requireManageableBooking(orgSlug, bookingId)
  if (isDenied(found)) return { error: found.error }

  const result = await validateReschedulable(bookingId)
  if ("error" in result) return result

  const outcome = await performReschedule(
    result.booking,
    result.eventType,
    new Date(newStartTimeISO),
    "HOST"
  )
  if (outcome.error) return outcome

  revalidateBooking(orgSlug, bookingId)
  return outcome
}

/** No session — the manageToken is the authorization boundary. */
export async function rescheduleBookingAsAttendee(
  manageToken: string,
  newStartTimeISO: string
): Promise<RescheduleResult> {
  const existing = await db.booking.findUnique({ where: { manageToken } })
  if (!existing) return { error: "This booking link is invalid." }

  const result = await validateReschedulable(existing.id)
  if ("error" in result) return result

  if (!result.eventType.isActive) {
    return {
      error:
        "Rescheduling isn't available right now. Please contact the host directly.",
    }
  }

  return performReschedule(
    result.booking,
    result.eventType,
    new Date(newStartTimeISO),
    "ATTENDEE"
  )
}

/**
 * Reschedule = cancel the old booking + create a new one, linked by
 * `rescheduledFromId`. Keeping both rows preserves the full audit trail.
 *
 * Customer counters are deliberately NOT touched here — see the reschedule
 * note in lib/customer-counters.ts. The deltas cancel out exactly, so
 * adjusting them would introduce the drift, not prevent it.
 */
async function performReschedule(
  booking: Booking,
  eventType: EventType,
  newStartTime: Date,
  initiatedBy: "HOST" | "ATTENDEE"
): Promise<RescheduleResult> {
  const newEndTime = new Date(
    newStartTime.getTime() + booking.durationMinutes * 60_000
  )

  // Slots shown in the UI may be stale by submission time — re-verify.
  const check = await getEventTypeSlots({
    eventType: { ...eventType, durationMinutes: booking.durationMinutes },
    rangeStart: newStartTime,
    rangeEnd: newEndTime,
    excludeBookingId: booking.id,
  })
  if ("error" in check) return { error: check.error }

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
            // Always CONFIRMED: only CONFIRMED bookings reach this point.
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
      // Always the attendee-facing manage link: the host reaches the booking
      // through the dashboard, and the attendee needs a working token.
      manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${newManageToken}`,
    })

    return {
      success: "Booking rescheduled.",
      newBookingId: newBooking.id,
      newManageToken,
    }
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
