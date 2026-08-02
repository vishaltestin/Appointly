import { z } from "zod"

export const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
})

export const updateOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Only lowercase letters, numbers, and hyphens allowed"
    ),
  timezone: z.string().min(1, "Select a timezone"),
})

export type CreateOrgInput = z.infer<typeof createOrgSchema>
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
