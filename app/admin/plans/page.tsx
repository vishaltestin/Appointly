import { Building2, CreditCard, TrendingUp } from "lucide-react"
import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/session"
import { PLANS, PLAN_ORDER } from "@/lib/plans"
import { adminPlanListQuerySchema } from "@/lib/validations/billing.schema"
import { StatCard } from "@/components/admin/stat-card"
import { PlanFilterTabs } from "@/components/admin/plan-filter-tabs"
import { PlansTable } from "@/components/admin/plans-table"
import { PaginationControls } from "@/components/admin/pagination-controls"

const PAGE_SIZE = 10

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; page?: string }>
}) {
  await requireSuperAdmin()
  const raw = await searchParams
  const { plan, page } = adminPlanListQuerySchema.parse(raw)

  const where = plan === "ALL" ? {} : { plan }

  const [organizations, total, planCounts, totalOrgs] = await Promise.all([
    db.organization.findMany({
      where,
      orderBy: [{ plan: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { memberships: true, eventTypes: true } },
      },
    }),
    db.organization.count({ where }),
    db.organization.groupBy({ by: ["plan"], _count: { id: true } }),
    db.organization.count(),
  ])

  const countByPlan = Object.fromEntries(
    planCounts.map((row) => [row.plan, row._count.id])
  ) as Record<string, number>

  // MRR is indicative only — plans are recorded manually, so this reflects
  // what's been entered in the admin panel, not money actually collected.
  const indicativeMrr = PLAN_ORDER.reduce(
    (sum, id) => sum + PLANS[id].price * (countByPlan[id] ?? 0),
    0
  )
  const paidOrgs = (countByPlan.PRO ?? 0) + (countByPlan.BUSINESS ?? 0)

  const rows = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    status: org.status,
    memberCount: org._count.memberships,
    eventTypeCount: org._count.eventTypes,
    planChangedAt: org.planChangedAt,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Plans &amp; Billing
        </h1>
        <p className="text-sm text-muted-foreground">
          Manually move workspaces between plans. Payment is collected offline.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Indicative MRR"
          value={`$${indicativeMrr.toLocaleString()}`}
          icon={TrendingUp}
          hint="Based on recorded plans, not collected payments"
        />
        <StatCard
          label="Paid workspaces"
          value={paidOrgs}
          icon={CreditCard}
          hint={`${totalOrgs - paidOrgs} on Free`}
        />
        <StatCard label="Total workspaces" value={totalOrgs} icon={Building2} />
      </div>

      <PlanFilterTabs counts={{ ALL: totalOrgs, ...countByPlan }} />

      <div className="rounded-xl border bg-card">
        <PlansTable organizations={rows} />
        <PaginationControls
          page={page}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        />
      </div>
    </div>
  )
}
