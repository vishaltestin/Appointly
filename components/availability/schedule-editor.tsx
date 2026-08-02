"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import {
  updateScheduleDetailsSchema,
  type UpdateScheduleDetailsInput,
} from "@/lib/validations/availability.schema"
import { updateScheduleDetails } from "@/actions/availability.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { COMMON_TIMEZONES } from "@/lib/timezones"
import { WeeklyHoursEditor } from "@/components/availability/weekly-hours-editor"
import { DateOverridesManager } from "@/components/availability/date-overrides-manager"
import { AvailabilityPreview } from "@/components/availability/availability-preview"

interface ScheduleEditorProps {
  orgSlug: string
  schedule: {
    id: string
    name: string
    timezone: string
    bufferBefore: number
    bufferAfter: number
    workingHours: { dayOfWeek: number; startTime: string; endTime: string }[]
    dateOverrides: {
      id: string
      date: Date
      type: "UNAVAILABLE" | "CUSTOM_HOURS"
      startTime: string | null
      endTime: string | null
      reason: string | null
    }[]
  }
}

export function ScheduleEditor({ orgSlug, schedule }: ScheduleEditorProps) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateScheduleDetailsInput>({
    resolver: zodResolver(updateScheduleDetailsSchema),
    defaultValues: {
      name: schedule.name,
      timezone: schedule.timezone,
      bufferBeforeMinutes: schedule.bufferBefore,
      bufferAfterMinutes: schedule.bufferAfter,
    },
  })

  function onSubmit(values: UpdateScheduleDetailsInput) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await updateScheduleDetails(orgSlug, schedule.id, values)
      if (res?.error) {
        setError(res.error)
        return
      }
      setSuccess(res?.success ?? "Saved.")
      // Timezone and buffer changes directly affect computed slots —
      // without this, the preview silently shows stale data until reload.
      queryClient.invalidateQueries({
        queryKey: ["schedule-preview", schedule.id],
      })
    })
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border p-5"
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Schedule name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={watch("timezone")}
              onValueChange={(next: string | null) => {
                if (next) setValue("timezone", next, { shouldDirty: true })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bufferBefore">
              Buffer before meetings (minutes)
            </Label>
            <Input
              id="bufferBefore"
              type="number"
              min={0}
              max={120}
              {...register("bufferBeforeMinutes", { valueAsNumber: true })}
            />
            {errors.bufferBeforeMinutes && (
              <p className="text-sm text-destructive">
                {errors.bufferBeforeMinutes.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bufferAfter">Buffer after meetings (minutes)</Label>
            <Input
              id="bufferAfter"
              type="number"
              min={0}
              max={120}
              {...register("bufferAfterMinutes", { valueAsNumber: true })}
            />
            {errors.bufferAfterMinutes && (
              <p className="text-sm text-destructive">
                {errors.bufferAfterMinutes.message}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save details
        </Button>
      </form>

      <Separator />

      <div>
        <h2 className="mb-3 text-lg font-medium">Weekly hours</h2>
        <WeeklyHoursEditor
          orgSlug={orgSlug}
          scheduleId={schedule.id}
          initialWorkingHours={schedule.workingHours}
        />
      </div>

      <Separator />

      <DateOverridesManager
        orgSlug={orgSlug}
        scheduleId={schedule.id}
        overrides={schedule.dateOverrides}
      />

      <Separator />

      <AvailabilityPreview orgSlug={orgSlug} scheduleId={schedule.id} />
    </div>
  )
}
