import { cn } from "@/lib/utils"
import { LinkButton } from "@/components/shared/link-button"

/**
 * Consistent empty state for lists, tables and dashboard widgets.
 * Renders a dashed panel with an icon, title, description and optional CTA.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: { href: string; label: string }
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <LinkButton href={action.href} size="sm" className="mt-4">
          {action.label}
        </LinkButton>
      )}
    </div>
  )
}
