"use server"

import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import {
  startOfDay,
  subDays,
  eachDayOfInterval,
  format,
  getDay,
  getHours,
} from "date-fns"

// ── Stats Cards ──────────────────────────────────────────────────────────────

export async function getDashboardStats(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [upcomingCount, completedCount, cancelledThisMonth, hoursResult] =
    await Promise.all([
      // Upcoming: confirmed bookings in the future
      db.booking.count({
        where: {
          hostMembershipId: membership.id,
          status: "CONFIRMED",
          startTime: { gte: now },
        },
      }),

      // Completed: confirmed bookings in the past
      db.booking.count({
        where: {
          hostMembershipId: membership.id,
          status: "CONFIRMED",
          startTime: { lt: now },
        },
      }),

      // Cancelled this month
      db.booking.count({
        where: {
          hostMembershipId: membership.id,
          status: "CANCELLED",
          cancelledAt: { gte: monthStart },
        },
      }),

      // Total hours booked (completed bookings only)
      db.booking.aggregate({
        where: {
          hostMembershipId: membership.id,
          status: "CONFIRMED",
          startTime: { lt: now },
        },
        _sum: { durationMinutes: true },
      }),
    ])

  const totalHours = Math.round((hoursResult._sum.durationMinutes ?? 0) / 60)

  return {
    upcomingCount,
    completedCount,
    cancelledThisMonth,
    totalHours,
  }
}

// ── Booking Volume (last 30 days) ────────────────────────────────────────────

export async function getBookingVolume(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)
  const now = new Date()
  const thirtyDaysAgo = startOfDay(subDays(now, 29))

  const bookings = await db.booking.findMany({
    where: {
      hostMembershipId: membership.id,
      status: { in: ["CONFIRMED", "PENDING"] },
      startTime: { gte: thirtyDaysAgo },
    },
    select: { startTime: true },
  })

  // Build a map of date → count
  const countByDate = new Map<string, number>()
  for (const b of bookings) {
    const key = format(b.startTime, "yyyy-MM-dd")
    countByDate.set(key, (countByDate.get(key) ?? 0) + 1)
  }

  // Fill in all 30 days (including zeros)
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now })
  return days.map((day) => ({
    date: format(day, "MMM d"),
    count: countByDate.get(format(day, "yyyy-MM-dd")) ?? 0,
  }))
}

// ── Popular Event Types ──────────────────────────────────────────────────────

export async function getPopularEventTypes(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)

  const results = await db.booking.groupBy({
    by: ["eventTitle"],
    where: {
      hostMembershipId: membership.id,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  })

  // Fetch colors from event types (some may be deleted, so we look up
  // separately and fall back to a neutral color)
  const eventTypes = await db.eventType.findMany({
    where: {
      membershipId: membership.id,
      title: { in: results.map((r) => r.eventTitle) },
    },
    select: { title: true, color: true },
  })
  const colorMap = new Map(eventTypes.map((et) => [et.title, et.color]))

  return results.map((r) => ({
    title: r.eventTitle,
    count: r._count.id,
    color: colorMap.get(r.eventTitle) ?? "#94a3b8",
  }))
}

// ── Busiest Times ────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export async function getBusiestTimes(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)

  const bookings = await db.booking.findMany({
    where: {
      hostMembershipId: membership.id,
      status: "CONFIRMED",
    },
    select: { startTime: true, hostTimezone: true },
  })

  const byDayOfWeek: { day: string; count: number }[] = DAY_NAMES.map(
    (day) => ({ day, count: 0 })
  )
  const byHourOfDay: { hour: number; count: number }[] = Array.from(
    { length: 24 },
    (_, i) => ({ hour: i, count: 0 })
  )

  for (const b of bookings) {
    const dayIndex = getDay(b.startTime)
    byDayOfWeek[dayIndex].count++

    const hour = getHours(b.startTime)
    byHourOfDay[hour].count++
  }

  return { byDayOfWeek, byHourOfDay }
}

// ── Upcoming Bookings ────────────────────────────────────────────────────────

export async function getUpcomingBookings(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)

  const bookings = await db.booking.findMany({
    where: {
      hostMembershipId: membership.id,
      status: { in: ["CONFIRMED", "PENDING"] },
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: "asc" },
    take: 5,
    select: {
      id: true,
      eventTitle: true,
      startTime: true,
      durationMinutes: true,
      attendeeName: true,
      attendeeEmail: true,
      status: true,
    },
  })

  return bookings
}
