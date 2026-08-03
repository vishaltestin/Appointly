import { z } from "zod"

export const changePlanSchema = z.object({
  organizationId: z.string().min(1),
  plan: z.enum(["FREE", "PRO", "BUSINESS"]),
  // Free-text so the admin can record *why* (invoice #, offline payment ref,
  // "comped for a partner", etc.). Stored on both the org and the log entry.
  notes: z.string().max(500).optional().or(z.literal("")),
})

export const adminPlanListQuerySchema = z.object({
  plan: z.enum(["ALL", "FREE", "PRO", "BUSINESS"]).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
})

export type ChangePlanInput = z.infer<typeof changePlanSchema>
export type AdminPlanListQuery = z.infer<typeof adminPlanListQuerySchema>
