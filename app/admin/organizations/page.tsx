import { db } from "@/lib/db"
import { adminListQuerySchema } from "@/lib/validations/admin.schema"
import { AdminSearchInput } from "@/components/admin/admin-search-input"
import { OrganizationsTable } from "@/components/admin/organizations-table"
import { PaginationControls } from "@/components/admin/pagination-controls"

const PAGE_SIZE = 10

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const raw = await searchParams
  const { q, page } = adminListQuerySchema.parse(raw)

  const where = q
    ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }] }
    : {}

  const [organizations, total] = await Promise.all([
    db.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { memberships: true } } },
    }),
    db.organization.count({ where }),
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
        </p>
      </div>

      <AdminSearchInput placeholder="Search by name or URL..." />

      <div className="rounded-xl border bg-card">
        <OrganizationsTable organizations={rows} />
        <PaginationControls
          page={page}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        />
      </div>
    </div>
  )
}
