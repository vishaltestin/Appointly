/**
 * Repairs drifted Customer aggregate counters.
 *
 * Why this exists: before the counters were consolidated into
 * lib/customer-counters.ts, the cancellation path wired to the UI never
 * adjusted them, so `completedBookings` and `cancelledBookings` drifted on
 * every cancellation. Existing rows need a one-time recompute; the code
 * going forward keeps them correct.
 *
 * Safe to re-run — it recomputes from bookings, it doesn't increment.
 *
 *   npx tsx scripts/recompute-customer-counters.ts          # report only
 *   npx tsx scripts/recompute-customer-counters.ts --apply  # write fixes
 */
import { db } from "@/lib/db"
import { recomputeCustomerCounters } from "@/lib/customer-counters"

const APPLY = process.argv.includes("--apply")

async function main() {
  const customers = await db.customer.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      totalBookings: true,
      completedBookings: true,
      cancelledBookings: true,
    },
    orderBy: { createdAt: "asc" },
  })

  console.log(
    `\nChecking ${customers.length} customer${customers.length === 1 ? "" : "s"}${
      APPLY ? " (APPLY mode — will write)" : " (dry run — no writes)"
    }\n`
  )

  let drifted = 0

  for (const customer of customers) {
    // Same definitions as lib/customer-counters.ts. Bookings superseded by a
    // reschedule are excluded from total/cancelled: one logical booking moved
    // twice is still one booking, not three.
    const [total, completed, cancelled] = await Promise.all([
      db.booking.count({
        where: { customerId: customer.id, rescheduledTo: null },
      }),
      db.booking.count({
        where: { customerId: customer.id, status: "CONFIRMED" },
      }),
      db.booking.count({
        where: {
          customerId: customer.id,
          status: "CANCELLED",
          rescheduledTo: null,
        },
      }),
    ])

    const isDrifted =
      total !== customer.totalBookings ||
      completed !== customer.completedBookings ||
      cancelled !== customer.cancelledBookings

    if (!isDrifted) continue

    drifted++
    console.log(`  ${customer.name} <${customer.email}>`)
    console.log(
      `    total     ${customer.totalBookings} → ${total}` +
        (total !== customer.totalBookings ? "   ✱" : "")
    )
    console.log(
      `    completed ${customer.completedBookings} → ${completed}` +
        (completed !== customer.completedBookings ? "   ✱" : "")
    )
    console.log(
      `    cancelled ${customer.cancelledBookings} → ${cancelled}` +
        (cancelled !== customer.cancelledBookings ? "   ✱" : "")
    )

    if (APPLY) {
      await recomputeCustomerCounters(customer.id)
      console.log("    ✓ repaired")
    }
    console.log()
  }

  if (drifted === 0) {
    console.log("✅ All customer counters are accurate.\n")
  } else if (APPLY) {
    console.log(`✅ Repaired ${drifted} customer record(s).\n`)
  } else {
    console.log(
      `⚠️  ${drifted} customer record(s) have drifted.\n` +
        `   Re-run with --apply to fix them.\n`
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
