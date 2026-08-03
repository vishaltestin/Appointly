import { z } from "zod"

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time")

export const createScheduleSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  timezone: z.string().min(1, "Select a timezone"),
  copyFromScheduleId: z.string().optional(),
})

export const updateScheduleDetailsSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  timezone: z.string().min(1, "Select a timezone"),
  bufferBeforeMinutes: z.number().int().min(0).max(120),
  bufferAfterMinutes: z.number().int().min(0).max(120),
})

const timeRangeSchema = z
  .object({ startTime: timeStringSchema, endTime: timeStringSchema })
  .refine((r) => r.startTime < r.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })

const workingHoursDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    ranges: z.array(timeRangeSchema).max(5, "Too many time ranges for one day"),
  })
  .refine(
    (day) => {
      const sorted = [...day.ranges].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      )
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime < sorted[i - 1].endTime) return false
      }
      return true
    },
    { message: "Time ranges cannot overlap", path: ["ranges"] }
  )

export const updateWorkingHoursSchema = z.object({
  days: z.array(workingHoursDaySchema).length(7),
})

export const dateOverrideSchema = z
  .object({
    date: z.coerce.date(),
    type: z.enum(["UNAVAILABLE", "CUSTOM_HOURS"]),
    startTime: timeStringSchema.optional(),
    endTime: timeStringSchema.optional(),
    reason: z.string().max(100).optional(),
  })
  .refine(
    (data) =>
      data.type === "UNAVAILABLE" ||
      (!!data.startTime && !!data.endTime && data.startTime < data.endTime),
    { message: "Provide a valid start and end time", path: ["endTime"] }
  )

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type UpdateScheduleDetailsInput = z.infer<
  typeof updateScheduleDetailsSchema
>
export type UpdateWorkingHoursInput = z.infer<typeof updateWorkingHoursSchema>
export type DateOverrideInput = z.infer<typeof dateOverrideSchema>
