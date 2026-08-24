import { cn } from "@/lib/utils"

/**
 * Appointly wordmark: the Digital Fueled "DF" mark in a rounded tile + name.
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
          "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg",
          iconClassName
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- server-safe brand mark, no next/image needed */}
        <img
          src="/brand-mark.png"
          alt=""
          className="size-full object-cover"
        />
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
