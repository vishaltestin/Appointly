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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { getInitials } from "@/lib/utils"
import type { GlobalRole } from "@/generated/prisma/client"

interface UserRow {
  id: string
  name: string | null
  email: string
  image: string | null
  globalRole: GlobalRole
  status: "ACTIVE" | "SUSPENDED"
  orgCount: number
  createdAt: Date
}

export function UsersTable({ users }: { users: UserRow[] }) {
  if (users.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No users found.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Workspaces</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <Link
                href={`/admin/users/${user.id}`}
                className="flex items-center gap-3 hover:underline"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </Link>
            </TableCell>
            <TableCell>{user.orgCount}</TableCell>
            <TableCell>
              {user.globalRole === "SUPER_ADMIN" ? (
                <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-400">
                  Super admin
                </Badge>
              ) : (
                <Badge variant="secondary">User</Badge>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={user.status} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDistanceToNow(user.createdAt, { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
