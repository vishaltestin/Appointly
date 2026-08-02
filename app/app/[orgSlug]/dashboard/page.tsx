import Link from "next/link"
import { CalendarClock, Link as LinkIcon, Users } from "lucide-react"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { CopyLinkButton } from "@/components/event-types/copy-link-button"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)

  const [upcomingCount, eventTypeCount] = await Promise.all([
    db.booking.count({
      where: {
        hostMembershipId: membership.id,
        status: "CONFIRMED",
        startTime: { gte: new Date() },
      },
    }),
    db.eventType.count({ where: { membershipId: membership.id } }),
  ])

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${orgSlug}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome, {membership.user.name} 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening in {membership.organization.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href={`/app/${orgSlug}/bookings`}
          className="rounded-xl border bg-card p-5 transition-colors hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Upcoming bookings
            </p>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{upcomingCount}</p>
        </Link>
        <Link
          href={`/app/${orgSlug}/event-types`}
          className="rounded-xl border bg-card p-5 transition-colors hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Event types
            </p>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{eventTypeCount}</p>
        </Link>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Your booking page
            </p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <CopyLinkButton url={publicUrl} />
          </div>
        </div>
      </div>
    </div>
  )
}
