import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendBookingReminderEmail } from "@/lib/mail"

const REMINDER_WINDOW_HOURS = 24

/**
 * Intended to be invoked periodically (e.g. hourly) by an external
 * scheduler — Vercel Cron, GitHub Actions, or any HTTP-capable cron
 * service. Protected by a shared secret since it performs writes and must
 * not be publicly triggerable.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const windowEnd = new Date(
    now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000
  )

  const bookings = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startTime: { gte: now, lte: windowEnd },
    },
  })

  let sent = 0
  for (const booking of bookings) {
    await sendBookingReminderEmail({
      to: booking.attendeeEmail,
      eventTitle: booking.eventTitle,
      startTime: booking.startTime,
      manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.manageToken}`,
    })
    await db.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: now },
    })
    sent++
  }

  return NextResponse.json({ processed: bookings.length, sent })
}
