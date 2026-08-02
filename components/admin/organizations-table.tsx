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
import { StatusBadge } from "@/components/shared/status-badge"

interface OrgRow {
  id: string
  name: string
  slug: string
  status: "ACTIVE" | "SUSPENDED"
  memberCount: number
  createdAt: Date
}

export function OrganizationsTable({
  organizations,
}: {
  organizations: OrgRow[]
}) {
  if (organizations.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No workspaces found.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Workspace</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell>
              <Link
                href={`/admin/organizations/${org.id}`}
                className="font-medium hover:underline"
              >
                {org.name}
              </Link>
              <p className="text-xs text-muted-foreground">/{org.slug}</p>
            </TableCell>
            <TableCell>{org.memberCount}</TableCell>
            <TableCell>
              <StatusBadge status={org.status} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDistanceToNow(org.createdAt, { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
