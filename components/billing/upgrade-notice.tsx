import Link from "next/link"
import { ArrowUpRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Shown at the point of friction (event types list, members list) once a
 * workspace is at its plan limit, so the user finds out *before* clicking a
 * create button and eating a server error.
 */
export function UpgradeNotice({
  orgSlug,
  message,
  className,
}: {
  orgSlug: string
  message: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-4",
        className
      )}
    >
      <Zap className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">{message}</p>
      <Link
        href={`/app/${orgSlug}/settings/plan`}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        View plans
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
