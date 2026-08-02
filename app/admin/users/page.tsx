import { db } from "@/lib/db"
import { adminListQuerySchema } from "@/lib/validations/admin.schema"
import { AdminSearchInput } from "@/components/admin/admin-search-input"
import { UsersTable } from "@/components/admin/users-table"
import { PaginationControls } from "@/components/admin/pagination-controls"

const PAGE_SIZE = 10

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const raw = await searchParams
  const { q, page } = adminListQuerySchema.parse(raw)

  const where = q
    ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
    : {}

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { memberships: true } } },
    }),
    db.user.count({ where }),
  ])

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    globalRole: user.globalRole,
    status: user.status,
    orgCount: user._count.memberships,
    createdAt: user.createdAt,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          {total} registered users
        </p>
      </div>

      <AdminSearchInput placeholder="Search by name or email..." />

      <div className="rounded-xl border bg-card">
        <UsersTable users={rows} />
        <PaginationControls
          page={page}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        />
      </div>
    </div>
  )
}
