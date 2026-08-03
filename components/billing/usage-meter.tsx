import { cn } from "@/lib/utils"
import { formatLimit, usagePercent } from "@/lib/plans"
import type { LucideIcon } from "lucide-react"

interface UsageMeterProps {
  label: string
  icon: LucideIcon
  current: number
  /** `null` = unlimited on this plan. */
  limit: number | null
  hint?: string
}

export function UsageMeter({
  label,
  icon: Icon,
  current,
  limit,
  hint,
}: UsageMeterProps) {
  const percent = usagePercent(current, limit)
  const atLimit = limit !== null && current >= limit
  const nearLimit = !atLimit && percent >= 80

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {current}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          / {formatLimit(limit)}
        </span>
      </p>

      {limit === null ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No limit on this plan.
        </p>
      ) : (
        <>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label} usage`}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                atLimit
                  ? "bg-destructive"
                  : nearLimit
                    ? "bg-amber-500 dark:bg-amber-400"
                    : "bg-primary"
              )}
              style={{ width: `${Math.max(percent, current > 0 ? 4 : 0)}%` }}
            />
          </div>
          <p
            className={cn(
              "mt-2 text-xs",
              atLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {atLimit
              ? "Limit reached — upgrade to add more."
              : (hint ?? `${percent}% used`)}
          </p>
        </>
      )}

      {limit === null && hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
