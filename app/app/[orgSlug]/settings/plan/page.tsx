import { CalendarClock, Link as LinkIcon, Users, UserRound } from "lucide-react"
import { format } from "date-fns"
import { requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import { getOrganizationUsage } from "@/lib/usage"
import { db } from "@/lib/db"
import { getPlan } from "@/lib/plans"
import { PlanBadge } from "@/components/shared/plan-badge"
import { UsageMeter } from "@/components/billing/usage-meter"
import { PlanComparison } from "@/components/billing/plan-comparison"
import { PlanHistory } from "@/components/billing/plan-history"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PlanSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)
  const canManageBilling = permissions.canManageBilling(membership.role)

  const usage = await getOrganizationUsage(membership.organizationId)
  const plan = getPlan(usage.plan)

  const logs = canManageBilling
    ? await db.planChangeLog.findMany({
        where: { organizationId: membership.organizationId },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : []

  return (
    <div className="space-y-10">
      {/* Current plan */}
      <section className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{plan.name} plan</h2>
                <PlanBadge plan={usage.plan} />
              </div>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              {membership.organization.planChangedAt && (
                <p className="text-xs text-muted-foreground">
                  Last changed{" "}
                  {format(membership.organization.planChangedAt, "d MMM yyyy")}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight">
                {plan.price === 0 ? "Free" : `$${plan.price}`}
                {plan.price > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-dashed bg-muted/30 p-4">
          <p className="text-sm font-medium">Need a different plan?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManageBilling
              ? "Billing is handled manually while we finish self-serve checkout. Email billing@appointly.dev and we'll move your workspace over — usually within one business day."
              : "Only the workspace owner can request a plan change."}
          </p>
        </div>
      </section>

      {/* Usage */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Usage</h2>
          <p className="text-sm text-muted-foreground">
            Where this workspace sits against its plan limits.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UsageMeter
            label="Event types"
            icon={LinkIcon}
            current={usage.eventTypes}
            limit={usage.limits.maxEventTypes}
          />
          <UsageMeter
            label="Seats"
            icon={Users}
            current={usage.seatsInUse}
            limit={usage.limits.maxTeamMembers}
            hint={
              usage.pendingInvitations > 0
                ? `${usage.teamMembers} member${usage.teamMembers === 1 ? "" : "s"} + ${usage.pendingInvitations} pending`
                : undefined
            }
          />
          <UsageMeter
            label="Bookings this month"
            icon={CalendarClock}
            current={usage.bookingsThisMonth}
            limit={null}
            hint="Unlimited on every plan."
          />
          <UsageMeter
            label="Customers"
            icon={UserRound}
            current={usage.customers}
            limit={null}
            hint="Unlimited on every plan."
          />
        </div>
      </section>

      {/* Plan comparison */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Compare plans</h2>
          <p className="text-sm text-muted-foreground">
            Existing data is never removed if you move to a smaller plan — you
            just can&apos;t add more until you&apos;re back under the limit.
          </p>
        </div>
        <PlanComparison currentPlan={usage.plan} />
      </section>

      {canManageBilling && <PlanHistory logs={logs} />}
    </div>
  )
}
