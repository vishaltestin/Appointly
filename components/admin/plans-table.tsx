"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { PlanBadge } from "@/components/shared/plan-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChangePlanDialog } from "@/components/admin/change-plan-dialog"
import type { SubscriptionPlan } from "@/generated/prisma/client"

export interface PlanRow {
  id: string
  name: string
  slug: string
  plan: SubscriptionPlan
  status: "ACTIVE" | "SUSPENDED"
  memberCount: number
  eventTypeCount: number
  planChangedAt: Date | null
}

const columns: ColumnDef<PlanRow>[] = [
  {
    id: "name",
    accessorFn: (org) => `${org.name} ${org.slug}`,
    header: "Workspace",
    meta: { csvValue: (org) => org.name },
    cell: ({ row }) => (
      <div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/organizations/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
          {row.original.status === "SUSPENDED" && (
            <StatusBadge status={row.original.status} />
          )}
        </div>
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
    accessorKey: "eventTypeCount",
    header: "Event types",
  },
  {
    accessorKey: "planChangedAt",
    header: "Plan changed",
    meta: {
      csvHeader: "Plan changed",
      csvValue: (org) =>
        org.planChangedAt
          ? new Date(org.planChangedAt).toISOString().slice(0, 10)
          : "",
    },
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.planChangedAt
          ? formatDistanceToNow(new Date(row.original.planChangedAt), {
              addSuffix: true,
            })
          : "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right">
        <ChangePlanDialog
          organizationId={row.original.id}
          orgName={row.original.name}
          currentPlan={row.original.plan}
        />
      </div>
    ),
  },
]

export function PlansTable({ organizations }: { organizations: PlanRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={organizations}
      csvFilename="appointly-plans"
      searchPlaceholder="Search workspaces…"
      emptyState={{
        title: "No workspaces on this plan",
        description: "Try another plan filter above.",
      }}
    />
  )
}
