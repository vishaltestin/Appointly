import { format } from "date-fns"
import { cn } from "@/lib/utils"

/**
 * Calendar-page date block used at the start of booking rows. Month over a
 * bold day number gives lists a scannable, scheduled-at-a-glance feel.
 */
export function BookingDateChip({
  date,
  className,
}: {
  date: Date
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/[0.07] ring-1 ring-primary/15 dark:bg-primary/10",
        className
      )}
    >
      <span className="text-[10px] font-semibold uppercase leading-none tracking-wide text-primary/70">
        {format(date, "MMM")}
      </span>
      <span className="text-base font-semibold leading-tight text-primary tabular-nums">
        {format(date, "d")}
      </span>
    </div>
  )
}
