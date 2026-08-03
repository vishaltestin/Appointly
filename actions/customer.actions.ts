"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import {
  customerListQuerySchema,
  updateCustomerNotesSchema,
  type CustomerListQuery,
  type UpdateCustomerNotesInput,
} from "@/lib/validations/customer.schema"

const PAGE_SIZE = 20

export async function getCustomers(orgSlug: string, query: CustomerListQuery) {
  const membership = await requireOrgMembership(orgSlug)
  const parsed = customerListQuerySchema.safeParse(query)
  if (!parsed.success) return { error: "Invalid query parameters." }

  const { search, sort, order, page } = parsed.data

  const where: Prisma.CustomerWhereInput = {
    organizationId: membership.organizationId,
    ...(search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : {}),
  }

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.customer.count({ where }),
  ])

  return {
    customers,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  }
}

export async function getCustomer(orgSlug: string, customerId: string) {
  const membership = await requireOrgMembership(orgSlug)

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId: membership.organizationId },
  })
  if (!customer) return { error: "Customer not found." }

  const bookings = await db.booking.findMany({
    where: { customerId: customer.id },
    orderBy: { startTime: "desc" },
    take: 50,
    select: {
      id: true,
      eventTitle: true,
      startTime: true,
      durationMinutes: true,
      status: true,
      hostName: true,
      cancelledBy: true,
      cancellationReason: true,
    },
  })

  return { customer, bookings }
}

export async function updateCustomerNotes(
  orgSlug: string,
  customerId: string,
  values: UpdateCustomerNotesInput
) {
  const membership = await requireOrgMembership(orgSlug)
  const parsed = updateCustomerNotesSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid input." }

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId: membership.organizationId },
  })
  if (!customer) return { error: "Customer not found." }

  await db.customer.update({
    where: { id: customerId },
    data: { notes: parsed.data.notes || null },
  })

  revalidatePath(`/app/${orgSlug}/customers/${customerId}`)
  return { success: "Notes saved." }
}
