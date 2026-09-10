"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { z } from "zod"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { COMMON_TIMEZONES } from "@/lib/timezones"
import { createScheduleSchema } from "@/lib/validations/availability.schema"
import { createSchedule } from "@/actions/availability.actions"

/** UI form = createScheduleSchema + the copy-from picker value. */
const formSchema = createScheduleSchema.extend({
  copyFrom: z.string(),
})
type FormInput = z.infer<typeof formSchema>

export function CreateScheduleDialog({
  orgSlug,
  existingSchedules,
  defaultTimezone,
}: {
  orgSlug: string
  existingSchedules: { id: string; name: string }[]
  defaultTimezone: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      timezone: defaultTimezone,
      copyFrom: "blank",
    },
  })

  const timezone = watch("timezone")
  const copyFrom = watch("copyFrom")

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      const res = await createSchedule(orgSlug, {
        name: values.name.trim(),
        timezone: values.timezone,
        copyFromScheduleId:
          values.copyFrom === "blank" ? undefined : values.copyFrom,
      })
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      setOpen(false)
      reset()
      if (res?.scheduleId) {
        router.push(`/app/${orgSlug}/availability/${res.scheduleId}`)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New schedule
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create a schedule</DialogTitle>
            <DialogDescription>
              Use different schedules for different types of meetings or
              working arrangements.
            </DialogDescription>
          </DialogHeader>

          {errors.root?.serverError && (
            <Alert variant="destructive">
              <AlertDescription>
                {errors.root.serverError.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="schedule-name">Name</Label>
            <Input
              id="schedule-name"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={timezone}
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

          {existingSchedules.length > 0 && (
            <div className="space-y-2">
              <Label>Start from</Label>
              <Select
                value={copyFrom}
                onValueChange={(next: string | null) => {
                  if (next) setValue("copyFrom", next, { shouldDirty: true })
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(v) =>
                      v === "blank"
                        ? "Default hours (Mon–Fri, 9–5)"
                        : `Copy from "${existingSchedules.find((s) => s.id === v)?.name ?? ""}"`
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">
                    Default hours (Mon–Fri, 9–5)
                  </SelectItem>
                  {existingSchedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      Copy from &quot;{s.name}&quot;
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
