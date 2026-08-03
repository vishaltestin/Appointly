import { z } from "zod"

export const customerListQuerySchema = z.object({
  search: z.string().max(100).optional().or(z.literal("")),
  sort: z
    .enum(["name", "email", "totalBookings", "lastBookingAt"])
    .default("lastBookingAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
})

export const updateCustomerNotesSchema = z.object({
  notes: z.string().max(2000).optional().or(z.literal("")),
})

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>
export type UpdateCustomerNotesInput = z.infer<typeof updateCustomerNotesSchema>
