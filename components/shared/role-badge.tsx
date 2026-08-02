import { Badge } from "@/components/ui/badge"
import type { OrgRole } from "@/generated/prisma/client"
import { cn } from "@/lib/utils"

const STYLES: Record<OrgRole, string> = {
  OWNER:
    "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400",
  ADMIN:
    "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400",
  MEMBER:
    "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300",
}

export function RoleBadge({
  role,
  className,
}: {
  role: OrgRole
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(STYLES[role], "font-medium capitalize", className)}
    >
      {role.toLowerCase()}
    </Badge>
  )
}
