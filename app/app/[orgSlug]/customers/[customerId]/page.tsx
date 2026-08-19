import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Mail,
  Clock,
  Calendar,
  CalendarX,
  CalendarCheck,
} from "lucide-react"
import { requireOrgMembership } from "@/lib/session"
import { getCustomer } from "@/actions/customer.actions"
import { CustomerNotesEditor } from "@/components/customers/customer-notes-editor"
import { CustomerBookingHistory } from "@/components/customers/customer-booking-history"

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; customerId: string }>
}) {
  const { orgSlug, customerId } = await params
  await requireOrgMembership(orgSlug)

  const result = await getCustomer(orgSlug, customerId)
  if ("error" in result) notFound()

  const { customer, bookings } = result

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/app/${orgSlug}/customers`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to customers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {customer.name}
        </h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          {customer.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Total bookings"
          value={customer.totalBookings}
        />
        <StatCard
          icon={<CalendarCheck className="h-4 w-4" />}
          label="Completed"
          value={customer.completedBookings}
        />
        <StatCard
          icon={<CalendarX className="h-4 w-4" />}
          label="Cancelled"
          value={customer.cancelledBookings}
        />
      </div>

      {customer.firstBookingAt && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Customer since{" "}
          {new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(customer.firstBookingAt)}
        </p>
      )}

      <CustomerNotesEditor
        orgSlug={orgSlug}
        customerId={customer.id}
        initialNotes={customer.notes}
      />

      <div>
        <h2 className="mb-3 text-lg font-medium">Booking history</h2>
        <CustomerBookingHistory orgSlug={orgSlug} bookings={bookings} />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
