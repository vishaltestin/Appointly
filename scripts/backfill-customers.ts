import { db } from "@/lib/db"

async function main() {
  const bookings = await db.booking.findMany({
    where: { customerId: null },
    select: {
      id: true,
      organizationId: true,
      attendeeEmail: true,
      attendeeName: true,
      attendeeTimezone: true,
      startTime: true,
      status: true,
    },
    orderBy: { startTime: "asc" },
  })

  console.log(`Backfilling ${bookings.length} bookings…`)

  for (const b of bookings) {
    const customer = await db.customer.upsert({
      where: {
        organizationId_email: {
          organizationId: b.organizationId,
          email: b.attendeeEmail,
        },
      },
      create: {
        organizationId: b.organizationId,
        email: b.attendeeEmail,
        name: b.attendeeName,
        timezone: b.attendeeTimezone,
        totalBookings: 1,
        completedBookings: b.status === "CONFIRMED" ? 1 : 0,
        cancelledBookings: b.status === "CANCELLED" ? 1 : 0,
        firstBookingAt: b.startTime,
        lastBookingAt: b.startTime,
      },
      update: {
        name: b.attendeeName,
        totalBookings: { increment: 1 },
        ...(b.status === "CONFIRMED"
          ? { completedBookings: { increment: 1 } }
          : {}),
        ...(b.status === "CANCELLED"
          ? { cancelledBookings: { increment: 1 } }
          : {}),
        lastBookingAt: b.startTime,
      },
    })

    await db.booking.update({
      where: { id: b.id },
      data: { customerId: customer.id },
    })
  }

  console.log("Done.")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
