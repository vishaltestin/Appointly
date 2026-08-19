import Link from "next/link"
import { format } from "date-fns"
import { Mail, Calendar, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

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

export function CustomerList({ orgSlug, result }: CustomerListProps) {
  const { customers, total, page, totalPages } = result

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-16 text-center">
        <Users className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          {total === 0 ? "No customers yet" : "No customers match your search"}
        </p>
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? "They'll appear here once someone books with you."
            : "Try adjusting your search terms."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card">
        <div className="divide-y">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/app/${orgSlug}/customers/${c.id}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{c.email}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="hidden items-center gap-1 sm:flex">
                  <Calendar className="h-3.5 w-3.5" />
                  {c.totalBookings} booking{c.totalBookings !== 1 ? "s" : ""}
                </span>
                {c.lastBookingAt && (
                  <span className="hidden text-xs lg:inline">
                    Last: {format(c.lastBookingAt, "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} customer
            {total !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} render={<Link href={`?page=${page - 1}`} />}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              render={<Link href={`?page=${page + 1}`} />}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
