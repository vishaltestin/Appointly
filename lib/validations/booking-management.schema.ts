import { z } from "zod"

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional().or(z.literal("")),
})

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
