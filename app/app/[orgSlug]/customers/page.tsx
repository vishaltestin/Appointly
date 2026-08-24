import { requireOrgMembership } from "@/lib/session"
import { getCustomers } from "@/actions/customer.actions"
import { CustomerList } from "@/components/customers/customer-list"
import { CustomerSearch } from "@/components/customers/customer-search"
import { CustomerSortSelect } from "@/components/customers/customer-sort-select"

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

  const sort =
    (sp.sort as "name" | "email" | "totalBookings" | "lastBookingAt") ??
    "lastBookingAt"
  const order = (sp.order as "asc" | "desc") ?? "desc"

  const result = await getCustomers(orgSlug, {
    search: sp.search,
    sort,
    order,
    page: sp.page ? Number(sp.page) : 1,
  })

  if ("error" in result) {
    return <p className="text-sm text-destructive">{result.error}</p>
  }

  // Carry the active filters into pagination links.
  const filterParams = new URLSearchParams()
  if (sp.search) filterParams.set("search", sp.search)
  filterParams.set("sort", sort)
  filterParams.set("order", order)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Everyone who has booked a meeting with you.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CustomerSearch defaultValue={sp.search} />
        <CustomerSortSelect sort={sort} order={order} />
      </div>
      <CustomerList
        orgSlug={orgSlug}
        result={result}
        filterQuery={filterParams.toString()}
      />
    </div>
  )
}
