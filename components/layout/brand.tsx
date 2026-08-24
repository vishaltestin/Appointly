import { CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Appointly wordmark: calendar glyph in a primary tile + name.
 * Server-safe — usable in any layout, public page, or email-style footer.
 */
export function Brand({
  className,
  iconClassName,
  labelClassName,
}: {
  className?: string
  iconClassName?: string
  labelClassName?: string
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          iconClassName
        )}
      >
        <CalendarClock className="size-4" strokeWidth={2.25} />
      </span>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          labelClassName
        )}
      >
        Appointly
      </span>
    </span>
  )
}
