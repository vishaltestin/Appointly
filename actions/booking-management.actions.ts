"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
} from "@/lib/mail"
import {
  cancelBookingSchema,
  updateBookingNotesSchema,
} from "@/lib/validations/booking-lifecycle.schema"

async function getManageableBooking(orgSlug: string, bookingId: string) {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })

  if (!booking || booking.organizationId !== membership.organizationId) {
    return { membership, booking: null as null }
  }

  const canManage =
    booking.hostMembershipId === membership.id ||
    permissions.canManageAllBookings(membership.role)
  if (!canManage) return { membership, booking: null as null }

  return { membership, booking }
}

export async function cancelBookingAsHost(
  orgSlug: string,
  bookingId: string,
  reason?: string
) {
  const { booking } = await getManageableBooking(orgSlug, bookingId)
  if (!booking) return { error: "Booking not found." }

  const parsed = cancelBookingSchema.safeParse({ reason })
  if (!parsed.success) return { error: "Invalid request." }
  if (booking.status === "CANCELLED")
    return { error: "This booking is already cancelled." }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelledBy: "HOST",
      cancelledAt: new Date(),
      cancelReason: parsed.data.reason || null,
    },
  })

  await sendBookingCancelledEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    startTime: booking.startTime,
    cancelledBy: "HOST",
    reason: parsed.data.reason,
  })

  revalidatePath(`/app/${orgSlug}/bookings`)
  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  return { success: "Booking cancelled." }
}

export async function confirmPendingBooking(
  orgSlug: string,
  bookingId: string
) {
  const { booking } = await getManageableBooking(orgSlug, bookingId)
  if (!booking) return { error: "Booking not found." }
  if (booking.status !== "PENDING")
    return { error: "This booking is not awaiting confirmation." }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  })

  await sendBookingConfirmedEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    hostName: booking.hostName,
    startTime: booking.startTime,
    manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.manageToken}`,
  })

  revalidatePath(`/app/${orgSlug}/bookings`)
  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  return { success: "Booking confirmed." }
}

export async function declinePendingBooking(
  orgSlug: string,
  bookingId: string,
  reason?: string
) {
  const { booking } = await getManageableBooking(orgSlug, bookingId)
  if (!booking) return { error: "Booking not found." }
  if (booking.status !== "PENDING")
    return { error: "This booking is not awaiting confirmation." }

  const parsed = cancelBookingSchema.safeParse({ reason })
  if (!parsed.success) return { error: "Invalid request." }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelledBy: "HOST",
      cancelledAt: new Date(),
      cancelReason: parsed.data.reason || "Declined by host",
    },
  })

  await sendBookingCancelledEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    startTime: booking.startTime,
    cancelledBy: "HOST",
    reason: parsed.data.reason || "Declined by host",
  })

  revalidatePath(`/app/${orgSlug}/bookings`)
  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  return { success: "Request declined." }
}

export async function updateBookingNotes(
  orgSlug: string,
  bookingId: string,
  notes: string
) {
  const { booking } = await getManageableBooking(orgSlug, bookingId)
  if (!booking) return { error: "Booking not found." }

  const parsed = updateBookingNotesSchema.safeParse({ notes })
  if (!parsed.success) return { error: "Notes are too long." }

  await db.booking.update({
    where: { id: bookingId },
    data: { hostNotes: parsed.data.notes || null },
  })

  revalidatePath(`/app/${orgSlug}/bookings/${bookingId}`)
  return { success: "Notes saved." }
}
