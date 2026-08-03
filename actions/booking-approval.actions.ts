"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import {
  sendBookingConfirmationEmail,
  sendBookingDeclinedEmail,
} from "@/lib/mail"

export async function approveBooking(orgSlug: string, bookingId: string) {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })

  if (!booking || booking.organizationId !== membership.organizationId)
    return { error: "Booking not found." }
  if (booking.hostMembershipId !== membership.id) {
    return { error: "You don't have permission to manage this booking." }
  }
  if (booking.status !== "PENDING")
    return { error: "This booking isn't awaiting approval." }

  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED" },
  })

  await sendBookingConfirmationEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    hostName: booking.hostName,
    startTime: booking.startTime,
    confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.manageToken}`,
    manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.manageToken}`,
  })

  revalidatePath(`/app/${orgSlug}/bookings`)
  return { success: "Booking approved." }
}

export async function declineBooking(
  orgSlug: string,
  bookingId: string,
  reason?: string
) {
  const membership = await requireOrgMembership(orgSlug)
  const booking = await db.booking.findUnique({ where: { id: bookingId } })

  if (!booking || booking.organizationId !== membership.organizationId)
    return { error: "Booking not found." }
  if (booking.hostMembershipId !== membership.id) {
    return { error: "You don't have permission to manage this booking." }
  }
  if (booking.status !== "PENDING")
    return { error: "This booking isn't awaiting approval." }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: "HOST",
      cancellationReason: reason || "Declined by host",
    },
  })

  await sendBookingDeclinedEmail({
    to: booking.attendeeEmail,
    eventTitle: booking.eventTitle,
    startTime: booking.startTime,
    hostName: booking.hostName,
    reason,
  })

  revalidatePath(`/app/${orgSlug}/bookings`)
  return { success: "Booking declined." }
}
