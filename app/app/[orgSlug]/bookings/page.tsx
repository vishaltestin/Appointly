import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { BookingTabs } from "@/components/bookings/booking-tabs"
import { BookingList } from "@/components/bookings/booking-list"
import { PendingBookingList } from "@/components/bookings/pending-booking-list"

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { orgSlug } = await params
  const { tab = "upcoming" } = await searchParams
  const membership = await requireOrgMembership(orgSlug)

  const pendingCount = await db.booking.count({
    where: { hostMembershipId: membership.id, status: "PENDING" },
  })

  if (tab === "pending") {
    const pending = await db.booking.findMany({
      where: { hostMembershipId: membership.id, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    })
    return (
      <div className="space-y-6">
        <Header />
        <BookingTabs pendingCount={pendingCount} />
        <PendingBookingList orgSlug={orgSlug} bookings={pending} />
      </div>
    )
  }

  const now = new Date()
  const where =
    tab === "past"
      ? {
          hostMembershipId: membership.id,
          status: "CONFIRMED" as const,
          endTime: { lt: now },
        }
      : tab === "cancelled"
        ? // Excludes bookings that were superseded by a reschedule — those
          // are technically CANCELLED under the hood but shouldn't clutter a
          // tab meant for genuine cancellations. See booking detail page for
          // the reschedule trail.
          {
            hostMembershipId: membership.id,
            status: "CANCELLED" as const,
            rescheduledTo: null,
          }
        : {
            hostMembershipId: membership.id,
            status: "CONFIRMED" as const,
            endTime: { gte: now },
          }

  const bookings = await db.booking.findMany({
    where,
    orderBy: { startTime: tab === "past" ? "desc" : "asc" },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <Header />
      <BookingTabs pendingCount={pendingCount} />
      <BookingList orgSlug={orgSlug} bookings={bookings} />
    </div>
  )
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
      <p className="text-sm text-muted-foreground">
        Meetings booked through your event types.
      </p>
    </div>
  )
}
