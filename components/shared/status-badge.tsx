import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function StatusBadge({ status }: { status: "ACTIVE" | "SUSPENDED" }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium capitalize",
        status === "ACTIVE"
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
      )}
    >
      {status.toLowerCase()}
    </Badge>
  )
}
