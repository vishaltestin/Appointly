import "server-only"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"

/**
 * Customer aggregate counters.
 *
 * These are denormalized on `Customer` to avoid COUNT queries on every list
 * render. Denormalized counters drift the moment one write path forgets to
 * update them — which is exactly what happened before this module existed —
 * so every transition lives here and nowhere else.
 *
 * ── Definitions (must match scripts/recompute-customer-counters.ts) ────────
 *
 *   totalBookings     — booking rows, EXCLUDING ones superseded by a
 *                       reschedule. A booking moved twice is still one
 *                       logical booking, not three.
 *   completedBookings — rows currently CONFIRMED.
 *   cancelledBookings — rows currently CANCELLED that were NOT superseded by
 *                       a reschedule. Matches the "Cancelled" tab on the
 *                       bookings list, which hides reschedule tombstones.
 *
 * ── Why reschedule is a no-op ──────────────────────────────────────────────
 *
 * Reschedule = cancel old + create new, sharing one customerId. Against the
 * definitions above the deltas cancel out exactly:
 *   total     old row becomes superseded (−1), new row counts (+1) → 0
 *   completed old CONFIRMED → CANCELLED (−1), new CONFIRMED (+1)   → 0
 *   cancelled old is superseded, so it isn't a real cancellation   → 0
 * Calling a counter helper from the reschedule path would corrupt the data,
 * not protect it. There is deliberately no function for it here.
 *
 * Every helper takes a transaction client so the counter write commits with
 * the booking write or not at all.
 */

type Tx = Prisma.TransactionClient

interface UpsertCustomerParams {
  organizationId: string
  email: string
  name: string
  timezone?: string
  bookingStartTime: Date
  bookingStatus: "CONFIRMED" | "PENDING" | "CANCELLED"
}

/**
 * Called when a brand-new booking is created (not a reschedule). Creates the
 * customer if this is their first booking with the org, otherwise bumps the
 * counters. Returns the customer ID to attach to the booking row.
 */
export async function onBookingCreated(
  tx: Tx,
  {
    organizationId,
    email,
    name,
    timezone,
    bookingStartTime,
    bookingStatus,
  }: UpsertCustomerParams
): Promise<string> {
  const customer = await tx.customer.upsert({
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
      // Name may change between bookings — always take the latest.
      name,
      timezone: timezone ?? undefined,
      totalBookings: { increment: 1 },
      ...(bookingStatus === "CONFIRMED"
        ? { completedBookings: { increment: 1 } }
        : {}),
      lastBookingAt: bookingStartTime,
      // firstBookingAt is never overwritten.
    },
  })

  return customer.id
}

/**
 * PENDING → CONFIRMED (host approved a request).
 * Only `completedBookings` moves; the booking already counted toward total.
 */
export async function onBookingApproved(tx: Tx, customerId: string | null) {
  if (!customerId) return
  await tx.customer.update({
    where: { id: customerId },
    data: { completedBookings: { increment: 1 } },
  })
}

/**
 * A genuine cancellation or decline (NOT a reschedule).
 *
 * `previousStatus` decides whether a confirmed slot is being given back:
 * declining a PENDING request never incremented `completedBookings`, so it
 * must not decrement it either.
 */
export async function onBookingCancelled(
  tx: Tx,
  customerId: string | null,
  previousStatus: "CONFIRMED" | "PENDING" | "CANCELLED"
) {
  if (!customerId) return
  await tx.customer.update({
    where: { id: customerId },
    data: {
      cancelledBookings: { increment: 1 },
      ...(previousStatus === "CONFIRMED"
        ? { completedBookings: { decrement: 1 } }
        : {}),
    },
  })
}

/**
 * Recomputes one customer's counters from their actual bookings.
 * Used by scripts/recompute-customer-counters.ts to repair historical drift.
 * Exported here so the definitions above stay the single source of truth.
 */
export async function recomputeCustomerCounters(customerId: string) {
  const [total, completed, cancelled, bounds] = await Promise.all([
    db.booking.count({ where: { customerId, rescheduledTo: null } }),
    db.booking.count({ where: { customerId, status: "CONFIRMED" } }),
    db.booking.count({
      where: { customerId, status: "CANCELLED", rescheduledTo: null },
    }),
    db.booking.aggregate({
      where: { customerId },
      _min: { startTime: true },
      _max: { startTime: true },
    }),
  ])

  await db.customer.update({
    where: { id: customerId },
    data: {
      totalBookings: total,
      completedBookings: completed,
      cancelledBookings: cancelled,
      firstBookingAt: bounds._min.startTime,
      lastBookingAt: bounds._max.startTime,
    },
  })

  return { total, completed, cancelled }
}
