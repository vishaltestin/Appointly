import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PlanBadge } from "@/components/shared/plan-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChangePlanDialog } from "@/components/admin/change-plan-dialog"
import type { SubscriptionPlan } from "@/generated/prisma/client"

interface PlanRow {
  id: string
  name: string
  slug: string
  plan: SubscriptionPlan
  status: "ACTIVE" | "SUSPENDED"
  memberCount: number
  eventTypeCount: number
  planChangedAt: Date | null
}

export function PlansTable({ organizations }: { organizations: PlanRow[] }) {
  if (organizations.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No workspaces on this plan.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Workspace</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Event types</TableHead>
          <TableHead>Plan changed</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/organizations/${org.id}`}
                  className="font-medium hover:underline"
                >
                  {org.name}
                </Link>
                {org.status === "SUSPENDED" && (
                  <StatusBadge status={org.status} />
                )}
              </div>
              <p className="text-xs text-muted-foreground">/{org.slug}</p>
            </TableCell>
            <TableCell>
              <PlanBadge plan={org.plan} />
            </TableCell>
            <TableCell>{org.memberCount}</TableCell>
            <TableCell>{org.eventTypeCount}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {org.planChangedAt
                ? formatDistanceToNow(org.planChangedAt, { addSuffix: true })
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              <ChangePlanDialog
                organizationId={org.id}
                orgName={org.name}
                currentPlan={org.plan}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
