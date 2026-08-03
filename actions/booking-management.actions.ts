"use server"

import { Booking, Prisma } from "@/generated/prisma/client"
import { addMinutes } from "date-fns"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { getEventTypeSlots } from "@/lib/booking-engine"
import { generateSecureToken } from "@/lib/tokens"
import {
  sendBookingCancellationEmail,
  sendBookingApprovedEmail,
  sendBookingDeclinedEmail,
  sendBookingRescheduledEmail,
} from "@/lib/mail"
import {
  cancelBookingSchema,
  type CancelBookingInput,
} from "@/lib/validations/booking-management.schema"

type CancellableBooking = Pick<
  Booking,
  | "id"
  | "status"
  | "startTime"
  | "eventTitle"
  | "hostName"
  | "hostEmail"
  | "attendeeName"
  | "attendeeEmail"
>

// ── Cancellation ────────────────────────────────────────────────────────────

export async function cancelBookingAsHost(
  orgSlug: string,
  bookingId: string,
  values: CancelBookingInput
) {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking || booking.organizationId !== membership.organizationId) {
    return { error: "Booking not found." }
  }
  if (booking.hostMembershipId !== membership.id) {
    return { error: "You don't have permission to cancel this booking." }
  }
  const result = await performCancellation(booking, "HOST", values)
  if (result.error) return result
  revalidatePath(`/app/${orgSlug}/bookings`)
  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  return { success: "Booking cancelled." }
}

/** No auth — the unguessable manageToken itself is the authorization. */
export async function cancelBookingAsAttendee(
  manageToken: string,
  values: CancelBookingInput
) {
  const booking = await db.booking.findUnique({ where: { manageToken } })
  if (!booking) return { error: "This booking link is invalid." }
  return performCancellation(booking, "ATTENDEE", values)
}

async function performCancellation(
  booking: CancellableBooking,
  cancelledBy: "HOST" | "ATTENDEE",
  values: CancelBookingInput
): Promise<{ error?: string; success?: string }> {
  const parsed = cancelBookingSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid cancellation details." }
  if (booking.status === "CANCELLED")
    return { error: "This booking is already cancelled." }
  if (booking.startTime < new Date())
    return { error: "Past bookings can't be cancelled." }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: parsed.data.reason || null,
    },
  })

  const notifyEmail =
    cancelledBy === "HOST" ? booking.attendeeEmail : booking.hostEmail
  const cancelledByLabel =
    cancelledBy === "HOST" ? booking.hostName : booking.attendeeName

  await sendBookingCancellationEmail({
    to: notifyEmail,
    eventTitle: booking.eventTitle,
    startTime: booking.startTime,
    cancelledByLabel,
    reason: parsed.data.reason || undefined,
  })

  return { success: "Booking cancelled." }
}

// ── Approval (requiresConfirmation event types) ─────────────────────────────

export async function approveBooking(orgSlug: string, bookingId: string) {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking || booking.organizationId !== membership.organizationId) {
    return { error: "Booking not found." }
  }
  if (booking.hostMembershipId !== membership.id) {
    return { error: "You don't have permission to manage this booking." }
  }
  if (booking.status !== "PENDING")
    return { error: "Only pending bookings can be approved." }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  })

  await sendBookingApprovedEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    hostName: booking.hostName,
    startTime: booking.startTime,
    manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.manageToken}`,
  })

  revalidatePath(`/app/${orgSlug}/bookings`)
  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  return { success: "Booking approved." }
}

export async function declineBooking(
  orgSlug: string,
  bookingId: string,
  values: CancelBookingInput
) {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking || booking.organizationId !== membership.organizationId) {
    return { error: "Booking not found." }
  }
  if (booking.hostMembershipId !== membership.id) {
    return { error: "You don't have permission to manage this booking." }
  }
  if (booking.status !== "PENDING")
    return { error: "Only pending bookings can be declined." }

  const parsed = cancelBookingSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid details." }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: "HOST",
      cancellationReason: parsed.data.reason || null,
    },
  })

  await sendBookingDeclinedEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    hostName: booking.hostName,
    startTime: booking.startTime,
    reason: parsed.data.reason || undefined,
  })

  revalidatePath(`/app/${orgSlug}/bookings`)
  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  return { success: "Booking declined." }
}

// ── Rescheduling ─────────────────────────────────────────────────────────────

export async function getRescheduleSlots(
  manageToken: string,
  rangeStartISO: string,
  rangeEndISO: string
) {
  const booking = await db.booking.findUnique({ where: { manageToken } })
  if (!booking) return { error: "Invalid booking link." }
  if (booking.status === "CANCELLED")
    return { error: "This booking has been cancelled." }
  if (!booking.eventTypeId)
    return { error: "This event type is no longer available for rescheduling." }

  const eventType = await db.eventType.findUnique({
    where: { id: booking.eventTypeId },
  })
  if (!eventType)
    return { error: "This event type is no longer available for rescheduling." }

  const result = await getEventTypeSlots({
    eventType,
    rangeStart: new Date(rangeStartISO),
    rangeEnd: new Date(rangeEndISO),
    excludeBookingId: booking.id,
  })
  if ("error" in result) return result
  return {
    slots: result.slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
    timezone: result.timezone,
  }
}

export async function getHostRescheduleSlots(
  orgSlug: string,
  bookingId: string,
  rangeStartISO: string,
  rangeEndISO: string
) {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking || booking.organizationId !== membership.organizationId)
    return { error: "Booking not found." }
  if (booking.hostMembershipId !== membership.id) {
    return { error: "You don't have permission to reschedule this booking." }
  }
  if (!booking.eventTypeId)
    return { error: "This event type no longer exists." }

  const eventType = await db.eventType.findUnique({
    where: { id: booking.eventTypeId },
  })
  if (!eventType) return { error: "This event type no longer exists." }

  const result = await getEventTypeSlots({
    eventType,
    rangeStart: new Date(rangeStartISO),
    rangeEnd: new Date(rangeEndISO),
    excludeBookingId: booking.id,
  })
  if ("error" in result) return result
  return {
    slots: result.slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
    timezone: result.timezone,
  }
}

/** No auth — the unguessable manageToken itself is the authorization. */
export async function rescheduleBookingAsAttendee(
  manageToken: string,
  newStartTimeISO: string
) {
  const booking = await db.booking.findUnique({ where: { manageToken } })
  if (!booking) return { error: "This booking link is invalid." }
  return performReschedule(booking, new Date(newStartTimeISO), "ATTENDEE")
}

export async function rescheduleBookingAsHost(
  orgSlug: string,
  bookingId: string,
  newStartTimeISO: string
) {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking || booking.organizationId !== membership.organizationId)
    return { error: "Booking not found." }
  if (booking.hostMembershipId !== membership.id) {
    return {
      error: "You don't have permission to reschedule this booking.",
    }
  }
  const result = await performReschedule(
    booking,
    new Date(newStartTimeISO),
    "HOST"
  )
  if (result.error) return result
  revalidatePath(`/app/${orgSlug}/bookings`)
  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  return result
}

async function performReschedule(
  oldBooking: Booking,
  newStartTime: Date,
  rescheduledBy: "HOST" | "ATTENDEE"
): Promise<
  | {
      error: string
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
> {
  if (oldBooking.status === "CANCELLED")
    return { error: "This booking has already been cancelled." }
  if (oldBooking.startTime < new Date())
    return { error: "Past bookings can't be rescheduled." }
  if (!oldBooking.eventTypeId) {
    return {
      error:
        "This event type no longer exists. Please contact the host to arrange a new time.",
    }
  }

  const eventType = await db.eventType.findUnique({
    where: { id: oldBooking.eventTypeId },
  })
  if (!eventType) {
    return {
      error:
        "This event type no longer exists. Please contact the host to arrange a new time.",
    }
  }

  const newEndTime = addMinutes(newStartTime, oldBooking.durationMinutes)
  const check = await getEventTypeSlots({
    eventType,
    rangeStart: newStartTime,
    rangeEnd: newEndTime,
    excludeBookingId: oldBooking.id,
  })
  if ("error" in check) return { error: check.error }

  const stillAvailable = check.slots.some(
    (s) => s.start.getTime() === newStartTime.getTime()
  )
  if (!stillAvailable) {
    return {
      error: "Sorry, this time slot was just booked. Please pick another time.",
    }
  }

  const newManageToken = generateSecureToken()

  try {
    const newBooking = await db.$transaction(
      async (tx) => {
        const conflict = await tx.booking.findFirst({
          where: {
            hostMembershipId: oldBooking.hostMembershipId,
            status: { in: ["CONFIRMED", "PENDING"] },
            id: { not: oldBooking.id },
            startTime: { lt: newEndTime },
            endTime: { gt: newStartTime },
          },
        })
        if (conflict) throw new Error("SLOT_TAKEN")

        const created = await tx.booking.create({
          data: {
            organizationId: oldBooking.organizationId,
            eventTypeId: oldBooking.eventTypeId,
            eventTitle: oldBooking.eventTitle,
            durationMinutes: oldBooking.durationMinutes,
            hostMembershipId: oldBooking.hostMembershipId,
            hostName: oldBooking.hostName,
            hostEmail: oldBooking.hostEmail,
            hostTimezone: oldBooking.hostTimezone,
            attendeeName: oldBooking.attendeeName,
            attendeeEmail: oldBooking.attendeeEmail,
            attendeeTimezone: oldBooking.attendeeTimezone,
            attendeeNotes: oldBooking.attendeeNotes,
            responses: (oldBooking.responses ?? {}) as Prisma.InputJsonValue,
            startTime: newStartTime,
            endTime: newEndTime,
            status: oldBooking.status,
            manageToken: newManageToken,
            rescheduledFromId: oldBooking.id,
          },
        })

        await tx.booking.update({
          where: { id: oldBooking.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledBy: rescheduledBy,
            cancellationReason: "Rescheduled to a new time",
          },
        })

        return created
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    const notifyEmail =
      rescheduledBy === "HOST" ? oldBooking.attendeeEmail : oldBooking.hostEmail
    const counterpartName =
      rescheduledBy === "HOST" ? oldBooking.attendeeName : oldBooking.hostName

    await sendBookingRescheduledEmail({
      to: notifyEmail,
      eventTitle: oldBooking.eventTitle,
      counterpartName,
      oldStartTime: oldBooking.startTime,
      newStartTime,
      manageUrl:
        rescheduledBy === "HOST"
          ? `${process.env.NEXT_PUBLIC_APP_URL}/manage/${newManageToken}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/app`,
    })

    return {
      success: "Booking rescheduled.",
      newBookingId: newBooking.id,
      newManageToken,
    }
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return {
        error:
          "Sorry, this time slot was just booked. Please pick another time.",
      }
    }
    throw err
  }
}
