"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { getInitials } from "@/lib/utils"
import type { GlobalRole } from "@/generated/prisma/client"

export interface UserRow {
  id: string
  name: string | null
  email: string
  image: string | null
  globalRole: GlobalRole
  status: "ACTIVE" | "SUSPENDED"
  orgCount: number
  createdAt: Date
}

const columns: ColumnDef<UserRow>[] = [
  {
    id: "name",
    // Name + email in one accessor: sorts by name and lets the global filter
    // match either field.
    accessorFn: (user) => `${user.name ?? ""} ${user.email}`,
    header: "User",
    meta: { csvValue: (user) => user.name ?? "" },
    cell: ({ row }) => (
      <Link
        href={`/admin/users/${row.original.id}`}
        className="flex items-center gap-3 hover:underline"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.image ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(row.original.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    // The email is shown inside the User cell, so this column is invisible
    // on screen but keeps the CSV export complete.
    cell: () => null,
    enableSorting: false,
  },
  {
    accessorKey: "orgCount",
    header: "Workspaces",
  },
  {
    accessorKey: "globalRole",
    header: "Role",
    cell: ({ row }) =>
      row.original.globalRole === "SUPER_ADMIN" ? (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400">
          Super admin
        </Badge>
      ) : (
        <Badge variant="secondary">User</Badge>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    meta: {
      csvHeader: "Joined",
      csvValue: (user) => new Date(user.createdAt).toISOString().slice(0, 10),
    },
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(row.original.createdAt), {
          addSuffix: true,
        })}
      </span>
    ),
  },
]

export function UsersTable({
  users,
  initialSearch,
}: {
  users: UserRow[]
  initialSearch?: string
}) {
  // The Email column exists purely for CSV export — hide it from the grid.
  const columnVisibility = { email: false }

  return (
    <DataTable
      columns={columns}
      data={users}
      columnVisibility={columnVisibility}
      csvFilename="appointly-users"
      searchPlaceholder="Search name or email…"
      initialSearch={initialSearch}
      emptyState={{
        title: "No users found",
        description: "Try a different search.",
      }}
    />
  )
}
