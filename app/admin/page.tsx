import Link from "next/link"
import { formatDistanceToNow, subDays } from "date-fns"
import {
  Building2,
  Users,
  UserPlus,
  CalendarClock,
  CreditCard,
} from "lucide-react"
import { db } from "@/lib/db"
import { StatCard } from "@/components/admin/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminOverviewPage() {
  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)

  const [
    totalOrgs,
    totalUsers,
    newUsers,
    totalBookings,
    planCounts,
    recentOrgs,
    recentUsers,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.booking.count(),
    db.organization.groupBy({ by: ["plan"], _count: { id: true } }),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { memberships: true } } },
    }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ])

  const countByPlan = Object.fromEntries(
    planCounts.map((row) => [row.plan, row._count.id])
  ) as Record<string, number>
  const paidOrgs = (countByPlan.PRO ?? 0) + (countByPlan.BUSINESS ?? 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Platform overview
        </h1>
        <p className="text-sm text-muted-foreground">
          A bird&apos;s-eye view across every workspace on Appointly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total workspaces" value={totalOrgs} icon={Building2} />
        <StatCard label="Total users" value={totalUsers} icon={Users} />
        <StatCard label="New users (7d)" value={newUsers} icon={UserPlus} />
        <StatCard
          label="Total bookings"
          value={totalBookings}
          icon={CalendarClock}
        />
        <StatCard
          label="Paid workspaces"
          value={paidOrgs}
          icon={CreditCard}
          hint={`${countByPlan.PRO ?? 0} Pro · ${countByPlan.BUSINESS ?? 0} Business`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Recent workspaces
            </CardTitle>
            <Link
              href="/admin/organizations"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentOrgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/admin/organizations/${org.id}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org._count.memberships} members ·{" "}
                      {formatDistanceToNow(org.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge status={org.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Recent users
            </CardTitle>
            <Link
              href="/admin/users"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <StatusBadge status={user.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
