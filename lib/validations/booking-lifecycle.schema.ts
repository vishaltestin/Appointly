import { z } from "zod"

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const rescheduleBookingSchema = z.object({
  newStartTime: z.coerce.date(),
})

export const updateBookingNotesSchema = z.object({
  notes: z.string().max(2000),
})

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>
export type UpdateBookingNotesInput = z.infer<typeof updateBookingNotesSchema>
