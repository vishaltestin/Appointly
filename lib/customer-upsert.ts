import "server-only"
import { db } from "@/lib/db"

interface UpsertCustomerParams {
  organizationId: string
  email: string
  name: string
  timezone?: string
  bookingStartTime: Date
  bookingStatus: "CONFIRMED" | "PENDING" | "CANCELLED"
}

/**
 * Called inside the same transaction that creates the booking, so the
 * customer record and counters stay consistent. Returns the customer ID
 * to attach to the booking row.
 */
export async function upsertCustomerOnBooking({
  organizationId,
  email,
  name,
  timezone,
  bookingStartTime,
  bookingStatus,
}: UpsertCustomerParams): Promise<string> {
  const customer = await db.customer.upsert({
    where: { organizationId_email: { organizationId, email } },
    create: {
      organizationId,
      email,
      name,
      timezone: timezone ?? null,
      totalBookings: 1,
      completedBookings: bookingStatus === "CONFIRMED" ? 1 : 0,
      cancelledBookings: 0,
      firstBookingAt: bookingStartTime,
      lastBookingAt: bookingStartTime,
    },
    update: {
      // Name might change between bookings — always take the latest.
      name,
      timezone: timezone ?? undefined,
      totalBookings: { increment: 1 },
      ...(bookingStatus === "CONFIRMED"
        ? { completedBookings: { increment: 1 } }
        : {}),
      lastBookingAt: bookingStartTime,
      firstBookingAt: undefined, // never overwrite the original first
    },
  })

  return customer.id
}

/**
 * Called when a booking is cancelled to decrement completedBookings
 * (if it was confirmed) and increment cancelledBookings. totalBookings
 * stays the same — we count all bookings ever, not just active ones.
 */
export async function adjustCustomerCountersOnCancellation(
  customerId: string,
  wasConfirmed: boolean
) {
  await db.customer.update({
    where: { id: customerId },
    data: {
      cancelledBookings: { increment: 1 },
      ...(wasConfirmed ? { completedBookings: { decrement: 1 } } : {}),
    },
  })
}
