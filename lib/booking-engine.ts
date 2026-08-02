import "server-only"
import { db } from "@/lib/db"
import { getAvailableSlots, type TimeSlot } from "@/lib/availability"

interface EventTypeForSlots {
  id: string
  durationMinutes: number
  minimumNoticeMinutes: number
  slotIntervalMinutes: number | null
  bufferBeforeMinutes: number | null
  bufferAfterMinutes: number | null
  maximumBookingsPerDay: number | null
  scheduleId: string | null
  membershipId: string
}

interface GetEventTypeSlotsParams {
  eventType: EventTypeForSlots
  rangeStart: Date
  rangeEnd: Date
  /** Excludes a specific booking from the busy-set — used when rescheduling
   *  so a booking's own current slot doesn't block itself from reappearing. */
  excludeBookingId?: string
}

export async function getEventTypeSlots({
  eventType,
  rangeStart,
  rangeEnd,
  excludeBookingId,
}: GetEventTypeSlotsParams): Promise<
  { slots: TimeSlot[]; timezone: string } | { error: string }
> {
  const schedule = eventType.scheduleId
    ? await db.schedule.findUnique({
        where: { id: eventType.scheduleId },
        include: { workingHours: true, dateOverrides: true },
      })
    : await db.schedule.findFirst({
        where: { membershipId: eventType.membershipId, isDefault: true },
        include: { workingHours: true, dateOverrides: true },
      })

  if (!schedule)
    return { error: "This host has no availability configured yet." }

  const existingBookings = await db.booking.findMany({
    where: {
      hostMembershipId: eventType.membershipId,
      // PENDING bookings must also block the slot — otherwise two pending
      // requests for the same time could both later be approved into a
      // double-booking.
      status: { in: ["CONFIRMED", "PENDING"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startTime: { lt: rangeEnd },
      endTime: { gt: rangeStart },
    },
    select: { startTime: true, endTime: true },
  })

  let slots = getAvailableSlots({
    timezone: schedule.timezone,
    workingHours: schedule.workingHours,
    dateOverrides: schedule.dateOverrides,
    durationMinutes: eventType.durationMinutes,
    slotIntervalMinutes: eventType.slotIntervalMinutes ?? undefined,
    bufferBeforeMinutes: eventType.bufferBeforeMinutes ?? schedule.bufferBefore,
    bufferAfterMinutes: eventType.bufferAfterMinutes ?? schedule.bufferAfter,
    minimumNoticeMinutes: eventType.minimumNoticeMinutes,
    rangeStart,
    rangeEnd,
    busy: existingBookings.map((b) => ({ start: b.startTime, end: b.endTime })),
  })

  if (eventType.maximumBookingsPerDay) {
    const countByDay = new Map<string, number>()
    for (const b of existingBookings) {
      const key = b.startTime.toISOString().slice(0, 10)
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1)
    }
    const limit = eventType.maximumBookingsPerDay
    slots = slots.filter((slot) => {
      const key = slot.start.toISOString().slice(0, 10)
      return (countByDay.get(key) ?? 0) < limit
    })
  }

  return { slots, timezone: schedule.timezone }
}
