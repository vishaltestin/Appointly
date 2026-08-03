import { requireOrgMembership } from "@/lib/session"
import {
  getDashboardStats,
  getBookingVolume,
  getPopularEventTypes,
  getBusiestTimes,
  getUpcomingBookings,
} from "@/actions/dashboard.actions"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { BookingVolumeChart } from "@/components/dashboard/booking-volume-chart"
import { PopularEventTypes } from "@/components/dashboard/popular-event-types"
import { BusiestTimes } from "@/components/dashboard/busiest-times"
import { UpcomingBookingsList } from "@/components/dashboard/upcoming-bookings-list"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)

  // Fetch all data in parallel
  const [stats, volume, popularTypes, busiestTimes, upcoming] =
    await Promise.all([
      getDashboardStats(orgSlug),
      getBookingVolume(orgSlug),
      getPopularEventTypes(orgSlug),
      getBusiestTimes(orgSlug),
      getUpcomingBookings(orgSlug),
    ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {membership.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your bookings.
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingVolumeChart data={volume} />
        <PopularEventTypes eventTypes={popularTypes} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BusiestTimes data={busiestTimes} />
        <UpcomingBookingsList orgSlug={orgSlug} bookings={upcoming} />
      </div>
    </div>
  )
}
