import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { PLANS, PLAN_ORDER } from "@/lib/plans"
import type { SubscriptionPlan } from "@/generated/prisma/client"

export function PlanComparison({
  currentPlan,
}: {
  currentPlan: SubscriptionPlan
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLAN_ORDER.map((id) => {
        const plan = PLANS[id]
        const isCurrent = id === currentPlan

        return (
          <div
            key={id}
            className={cn(
              "flex flex-col rounded-xl border bg-card p-5",
              isCurrent && "border-primary ring-1 ring-primary"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{plan.name}</h3>
              {isCurrent && (
                <Badge variant="secondary" className="font-medium">
                  Current
                </Badge>
              )}
            </div>

            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {plan.price === 0 ? (
                "Free"
              ) : (
                <>
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </>
              )}
            </p>

            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
