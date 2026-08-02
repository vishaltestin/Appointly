import { z } from "zod"

export const adminListQuerySchema = z.object({
  q: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
})

export const updateGlobalRoleSchema = z.object({
  userId: z.string(),
  globalRole: z.enum(["USER", "SUPER_ADMIN"]),
})

export type AdminListQuery = z.infer<typeof adminListQuerySchema>
export type UpdateGlobalRoleInput = z.infer<typeof updateGlobalRoleSchema>
