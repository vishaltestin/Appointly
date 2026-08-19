import Link from "next/link"
import { format } from "date-fns"
import { Mail, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        {total === 0
          ? "No customers yet. They'll appear here once someone books with you."
          : "No customers match your search."}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/app/${orgSlug}/customers/${c.id}`}
            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {c.email}
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {c.totalBookings} booking{c.totalBookings !== 1 ? "s" : ""}
              </span>
              {c.lastBookingAt && (
                <span className="hidden sm:inline">
                  Last: {format(c.lastBookingAt, "MMM d, yyyy")}
                </span>
              )}
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
            <Button variant="outline" size="sm" disabled={page <= 1}>
              <Link href={`?page=${page - 1}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              <Link href={`?page=${page + 1}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
