import Link from "next/link"
import { format } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Mail, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { LinkButton } from "@/components/shared/link-button"
import { avatarTint, cn, getInitials } from "@/lib/utils"

interface Customer {
  id: string
  name: string
  email: string
  totalBookings: number
  lastBookingAt: Date | null
}

interface CustomerListProps {
  orgSlug: string
  result: {
    customers: Customer[]
    total: number
    page: number
    totalPages: number
  }
}

export function CustomerList({
  orgSlug,
  result,
  filterQuery = "",
}: CustomerListProps & { filterQuery?: string }) {
  const { customers, total, page, totalPages } = result
  const pageHref = (p: number) =>
    `?page=${p}${filterQuery ? `&${filterQuery}` : ""}`

  if (customers.length === 0) {
    return total === 0 ? (
      <EmptyState
        icon={Users}
        title="No customers yet"
        description="Customers appear automatically when someone books with you."
      />
    ) : (
      <EmptyState
        icon={Users}
        title="No matches"
        description="No customers match your search. Try a different name or email."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-xl border bg-card">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/app/${orgSlug}/customers/${c.id}`}
            className="group flex items-center justify-between gap-4 p-4 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback
                  className={cn("text-xs font-semibold", avatarTint(c.name))}
                >
                  {getInitials(c.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.email}</span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="tabular-nums">{c.totalBookings}</span>
                <span className="hidden sm:inline">
                  booking{c.totalBookings !== 1 ? "s" : ""}
                </span>
              </span>
              {c.lastBookingAt && (
                <span className="hidden md:inline">
                  Last: {format(c.lastBookingAt, "MMM d, yyyy")}
                </span>
              )}
              <ChevronRight className="size-4 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground max-md:hidden" />
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} customer
            {total !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <PagerButton
              href={pageHref(page - 1)}
              disabled={page <= 1}
              label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </PagerButton>
            <PagerButton
              href={pageHref(page + 1)}
              disabled={page >= totalPages}
              label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </PagerButton>
          </div>
        </div>
      )}
    </div>
  )
}

function PagerButton({
  href,
  disabled,
  label,
  children,
}: {
  href: string
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2 opacity-50"
      >
        {children}
      </span>
    )
  }
  return (
    <LinkButton href={href} variant="outline" size="sm" aria-label={label}>
      {children}
    </LinkButton>
  )
}
