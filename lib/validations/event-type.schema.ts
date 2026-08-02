import { z } from "zod"

export const createEventTypeSchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
})

export const eventTypeDetailsSchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
  slug: z
    .string()
    .min(3, "Must be at least 3 characters")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional().or(z.literal("")),
  durationMinutes: z.number().int().min(5).max(480),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
  locationType: z.enum(["IN_PERSON", "PHONE_CALL", "ONLINE_MEETING", "CUSTOM"]),
  locationValue: z.string().max(255).optional().or(z.literal("")),
})

export const eventTypeAvailabilitySchema = z.object({
  scheduleId: z.string().nullable(),
  bufferBeforeMinutes: z.number().int().min(0).max(120).nullable(),
  bufferAfterMinutes: z.number().int().min(0).max(120).nullable(),
  minimumNoticeMinutes: z.number().int().min(0).max(10080),
  slotIntervalMinutes: z.number().int().min(5).max(480).nullable(),
  maximumBookingsPerDay: z.number().int().min(1).max(100).nullable(),
  requiresConfirmation: z.boolean(),
})
export const bookingQuestionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required").max(150),
  type: z.enum(["TEXT", "TEXTAREA", "PHONE"]),
  required: z.boolean(),
})

export const updateBookingQuestionsSchema = z.object({
  questions: z.array(bookingQuestionSchema).max(10, "Maximum 10 questions"),
})

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>
export type EventTypeDetailsInput = z.infer<typeof eventTypeDetailsSchema>
export type EventTypeAvailabilityInput = z.infer<
  typeof eventTypeAvailabilitySchema
>
export type UpdateBookingQuestionsInput = z.infer<
  typeof updateBookingQuestionsSchema
>
