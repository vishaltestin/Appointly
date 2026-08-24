import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SubscriptionPlan } from "@/generated/prisma/client"

const STYLES: Record<SubscriptionPlan, string> = {
  FREE: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300",
  PRO: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300",
  BUSINESS:
    "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
}

const LABELS: Record<SubscriptionPlan, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
}

export function PlanBadge({
  plan,
  className,
}: {
  plan: SubscriptionPlan
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", STYLES[plan], className)}
    >
      {LABELS[plan]}
    </Badge>
  )
}
