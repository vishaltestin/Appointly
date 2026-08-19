import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status = "PENDING" | "CONFIRMED" | "CANCELLED"

const STYLES: Record<Status, string> = {
  PENDING:
    "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400",
  CONFIRMED:
    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
  CANCELLED:
    "bg-zinc-100 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400",
}

export function BookingStatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium capitalize", STYLES[status])}
    >
      {status.toLowerCase()}
    </Badge>
  )
}
