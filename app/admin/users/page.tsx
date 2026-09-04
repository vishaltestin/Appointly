import { db } from "@/lib/db"
import { adminListQuerySchema } from "@/lib/validations/admin.schema"
import { UsersTable } from "@/components/admin/users-table"

// Client-side filtering, sorting, and pagination handle the rest — the query
// itself is only an upper bound so a giant install still stays fast.
const MAX_ROWS = 250

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const raw = await searchParams
  const { q } = adminListQuerySchema.parse(raw)

  const [users, total] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      include: { _count: { select: { memberships: true } } },
    }),
    db.user.count(),
  ])

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    globalRole: user.globalRole,
    status: user.status,
    orgCount: user._count.memberships,
    phone: user.phone,
    phoneVerifiedAt: user.phoneVerifiedAt,
    createdAt: user.createdAt,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          {total} registered users
          {total > MAX_ROWS && ` (showing ${MAX_ROWS} most recent)`}
        </p>
      </div>

      <UsersTable users={rows} initialSearch={q} />
    </div>
  )
}
