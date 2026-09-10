"use client"

import { useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TimeSelect } from "@/components/availability/time-select"
import { dateOverrideSchema } from "@/lib/validations/availability.schema"
import { addDateOverride } from "@/actions/availability.actions"

/**
 * UI form shape: the schema wants startTime/endTime only for CUSTOM_HOURS;
 * the form keeps them always visible-but-conditional, so the UI schema
 * carries the date as optional (to surface "pick a date" on submit).
 */
const formSchema = z.object({
  date: z.custom<Date>(
    (v) => v instanceof Date && !isNaN(v.getTime()),
    "Pick a date first."
  ),
  unavailable: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().max(100, "Keep it under 100 characters"),
})
type FormInput = z.infer<typeof formSchema>

export function AddOverrideDialog({
  orgSlug,
  scheduleId,
}: {
  orgSlug: string
  scheduleId: string
}) {
  const queryClient = useQueryClient()
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
      unavailable: true,
      startTime: "09:00",
      endTime: "17:00",
      reason: "",
    },
  })

  const date = watch("date")
  const unavailable = watch("unavailable")

  function onSubmit(values: FormInput) {
    const parsed = dateOverrideSchema.safeParse({
      date: values.date,
      type: values.unavailable ? "UNAVAILABLE" : "CUSTOM_HOURS",
      startTime: values.unavailable ? undefined : values.startTime,
      endTime: values.unavailable ? undefined : values.endTime,
      reason: values.reason.trim() ? values.reason.trim() : undefined,
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setError((issue.path[0] as "endTime") ?? "root.serverError", {
        message: issue.message,
      })
      return
    }
    startTransition(async () => {
      const res = await addDateOverride(orgSlug, scheduleId, parsed.data)
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      queryClient.invalidateQueries({
        queryKey: ["schedule-preview", scheduleId],
      })
      setOpen(false)
      reset()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Add date override
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add a date override</DialogTitle>
            <DialogDescription>
              Block off a holiday, or set special hours for a specific date.
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
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => setValue("date", d as Date, { shouldDirty: true })}
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="unavailable-toggle" className="text-sm">
              Mark entire day unavailable
            </Label>
            <Switch
              id="unavailable-toggle"
              checked={unavailable}
              onCheckedChange={(v) =>
                setValue("unavailable", Boolean(v), { shouldDirty: true })
              }
            />
          </div>

          {!unavailable && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <TimeSelect
                  value={watch("startTime")}
                  onChange={(v) =>
                    setValue("startTime", v, { shouldDirty: true })
                  }
                />
                <span className="text-sm text-muted-foreground">to</span>
                <TimeSelect
                  value={watch("endTime")}
                  onChange={(v) => setValue("endTime", v, { shouldDirty: true })}
                />
              </div>
              {errors.endTime && (
                <p className="text-sm text-destructive">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="override-reason">Label (optional)</Label>
            <Input
              id="override-reason"
              aria-invalid={!!errors.reason}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save override
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
