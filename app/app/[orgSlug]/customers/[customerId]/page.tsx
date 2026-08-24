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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { avatarTint, cn, getInitials } from "@/lib/utils"

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
    <div className="max-w-6xl space-y-6">
      <div>
        <Link
          href={`/app/${orgSlug}/customers`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to customers
        </Link>
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback
              className={cn(
                "text-sm font-semibold",
                avatarTint(customer.name)
              )}
            >
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <a
              href={`mailto:${customer.email}`}
              className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              {customer.email}
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Calendar}
          label="Total bookings"
          value={customer.totalBookings}
          color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={CalendarCheck}
          label="Completed"
          value={customer.completedBookings}
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={CalendarX}
          label="Cancelled"
          value={customer.cancelledBookings}
          color="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Customer since{" "}
        {new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(customer.createdAt)}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>
              Internal only — never shown to the customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerNotesEditor
              orgSlug={orgSlug}
              customerId={customer.id}
              initialNotes={customer.notes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking history</CardTitle>
            <CardDescription>Every booking from this customer</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerBookingHistory orgSlug={orgSlug} bookings={bookings} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            color
          )}
        >
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
