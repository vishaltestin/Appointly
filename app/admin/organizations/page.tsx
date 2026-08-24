import { db } from "@/lib/db"
import { adminListQuerySchema } from "@/lib/validations/admin.schema"
import { OrganizationsTable } from "@/components/admin/organizations-table"

// Client-side filtering, sorting, and pagination handle the rest — the query
// itself is only an upper bound so a giant install still stays fast.
const MAX_ROWS = 250

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const raw = await searchParams
  const { q } = adminListQuerySchema.parse(raw)

  const [organizations, total] = await Promise.all([
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      include: { _count: { select: { memberships: true } } },
    }),
    db.organization.count(),
  ])

  const rows = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    plan: org.plan,
    memberCount: org._count.memberships,
    createdAt: org.createdAt,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          {total} workspace{total !== 1 && "s"} on the platform
          {total > MAX_ROWS && ` (showing ${MAX_ROWS} most recent)`}
        </p>
      </div>

      <OrganizationsTable organizations={rows} initialSearch={q} />
    </div>
  )
}
