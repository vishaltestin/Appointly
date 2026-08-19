import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  comingSoon?: boolean
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  comingSoon,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5",
        comingSoon && "border-dashed bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight",
          comingSoon && "text-muted-foreground"
        )}
      >
        {comingSoon ? "—" : value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
