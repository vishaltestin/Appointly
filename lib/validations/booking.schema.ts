import { z } from "zod"

export const createBookingSchema = z.object({
  eventTypeId: z.string(),
  startTime: z.coerce.date(),
  attendeeName: z.string().min(1, "Name is required").max(100),
  attendeeEmail: z.string().email("Enter a valid email"),
  attendeeTimezone: z.string().min(1),
  attendeeNotes: z.string().max(1000).optional().or(z.literal("")),
  responses: z.record(z.string(), z.string().max(2000)).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
