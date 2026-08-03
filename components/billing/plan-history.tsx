import { ArrowRight, History } from "lucide-react"
import { format } from "date-fns"
import { PlanBadge } from "@/components/shared/plan-badge"
import type { SubscriptionPlan } from "@/generated/prisma/client"

interface PlanLogEntry {
  id: string
  fromPlan: SubscriptionPlan
  toPlan: SubscriptionPlan
  notes: string | null
  createdAt: Date
  /** Only resolved in the admin view; workspace owners see "Appointly team". */
  changedByName?: string
}

export function PlanHistory({
  logs,
  showActor = false,
}: {
  logs: PlanLogEntry[]
  showActor?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b p-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Plan history</h2>
      </div>

      {logs.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No plan changes recorded yet.
        </p>
      ) : (
        <div className="divide-y">
          {logs.map((log) => (
            <div key={log.id} className="space-y-1.5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <PlanBadge plan={log.fromPlan} />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <PlanBadge plan={log.toPlan} />
                <span className="ml-auto text-xs text-muted-foreground">
                  {format(log.createdAt, "d MMM yyyy, h:mm a")}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {showActor
                  ? `Changed by ${log.changedByName ?? "Unknown"}`
                  : "Changed by the Appointly team"}
                {log.notes && ` · ${log.notes}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
