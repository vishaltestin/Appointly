import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
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

  // OWNER/ADMIN see every booking in the workspace (per
  // `canManageAllBookings`); a MEMBER sees only the ones they host. The
  // change is deliberately list-wide: the same permission already gates
  // booking-detail access and lifecycle actions, so widening the list alone
  // would have produced rows the viewer couldn't open.
  const canSeeAll = permissions.canManageAllBookings(membership.role)
  const scope = canSeeAll
    ? { organizationId: membership.organizationId }
    : { hostMembershipId: membership.id }

  const pendingCount = await db.booking.count({
    where: { ...scope, status: "PENDING" },
  })

  if (tab === "pending") {
    const pending = await db.booking.findMany({
      where: { ...scope, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    })
    return (
      <div className="space-y-6">
        <Header workspaceWide={canSeeAll} />
        <BookingTabs pendingCount={pendingCount} />
        <PendingBookingList
          orgSlug={orgSlug}
          bookings={pending}
          showHost={canSeeAll}
        />
      </div>
    )
  }

  const now = new Date()
  const where =
    tab === "past"
      ? {
          ...scope,
          status: "CONFIRMED" as const,
          endTime: { lt: now },
        }
      : tab === "cancelled"
        ? // Excludes bookings that were superseded by a reschedule — those
          // are technically CANCELLED under the hood but shouldn't clutter a
          // tab meant for genuine cancellations. See booking detail page for
          // the reschedule trail.
          {
            ...scope,
            status: "CANCELLED" as const,
            rescheduledTo: null,
          }
        : {
            ...scope,
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
      <Header workspaceWide={canSeeAll} />
      <BookingTabs pendingCount={pendingCount} />
      <BookingList orgSlug={orgSlug} bookings={bookings} showHost={canSeeAll} />
    </div>
  )
}

function Header({ workspaceWide }: { workspaceWide: boolean }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
      <p className="text-sm text-muted-foreground">
        {workspaceWide
          ? "Every meeting booked across your workspace."
          : "Meetings booked through your event types."}
      </p>
    </div>
  )
}
