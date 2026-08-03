import { requireOrgMembership } from "@/lib/session"
import { getCustomers } from "@/actions/customer.actions"
import { CustomerList } from "@/components/customers/customer-list"
import { CustomerSearch } from "@/components/customers/customer-search"

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{
    search?: string
    sort?: string
    order?: string
    page?: string
  }>
}) {
  const { orgSlug } = await params
  const sp = await searchParams
  await requireOrgMembership(orgSlug)

  const result = await getCustomers(orgSlug, {
    search: sp.search,
    sort:
      (sp.sort as "name" | "email" | "totalBookings" | "lastBookingAt") ??
      "lastBookingAt",
    order: (sp.order as "asc" | "desc") ?? "desc",
    page: sp.page ? Number(sp.page) : 1,
  })

  if ("error" in result) {
    return <p className="text-sm text-destructive">{result.error}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Everyone who has booked a meeting with you.
        </p>
      </div>
      <CustomerSearch defaultValue={sp.search} />
      <CustomerList orgSlug={orgSlug} result={result} />
    </div>
  )
}
