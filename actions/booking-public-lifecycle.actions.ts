"use server"

import { revalidatePath } from "next/cache"
import type { Booking } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { sendBookingCancellationEmail } from "@/lib/mail"
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
