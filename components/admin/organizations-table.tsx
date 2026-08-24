"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { PlanBadge } from "@/components/shared/plan-badge"
import type { SubscriptionPlan } from "@/generated/prisma/client"

export interface OrgRow {
  id: string
  name: string
  slug: string
  status: "ACTIVE" | "SUSPENDED"
  plan: SubscriptionPlan
  memberCount: number
  createdAt: Date
}

const columns: ColumnDef<OrgRow>[] = [
  {
    id: "name",
    // Name + slug in one accessor: both sorts sensibly by name and makes the
    // global filter match "/acme-studio" too.
    accessorFn: (org) => `${org.name} ${org.slug}`,
    header: "Workspace",
    meta: { csvValue: (org) => org.name },
    cell: ({ row }) => (
      <div>
        <Link
          href={`/admin/organizations/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
        <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
      </div>
    ),
  },
  {
    accessorKey: "plan",
    header: "Plan",
    cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
  },
  {
    accessorKey: "memberCount",
    header: "Members",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    meta: {
      csvHeader: "Created",
      csvValue: (org) => new Date(org.createdAt).toISOString().slice(0, 10),
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

export function OrganizationsTable({
  organizations,
  initialSearch,
}: {
  organizations: OrgRow[]
  initialSearch?: string
}) {
  return (
    <DataTable
      columns={columns}
      data={organizations}
      csvFilename="appointly-organizations"
      searchPlaceholder="Search name or URL…"
      initialSearch={initialSearch}
      emptyState={{
        title: "No workspaces found",
        description: "Try a different search.",
      }}
    />
  )
}
