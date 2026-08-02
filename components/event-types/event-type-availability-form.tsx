"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import {
  eventTypeAvailabilitySchema,
  type EventTypeAvailabilityInput,
} from "@/lib/validations/event-type.schema"
import { updateEventTypeAvailability } from "@/actions/event-type.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  orgSlug: string
  eventTypeId: string
  defaultValues: EventTypeAvailabilityInput
  schedules: { id: string; name: string; isDefault: boolean }[]
}

export function EventTypeAvailabilityForm({
  orgSlug,
  eventTypeId,
  defaultValues,
  schedules,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { handleSubmit, watch, setValue, register } =
    useForm<EventTypeAvailabilityInput>({
      resolver: zodResolver(eventTypeAvailabilitySchema),
      defaultValues,
    })

  function onSubmit(values: EventTypeAvailabilityInput) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await updateEventTypeAvailability(
        orgSlug,
        eventTypeId,
        values
      )
      if (res?.error) {
        setError(res.error)
        return
      }
      setSuccess(res?.success ?? "Saved.")
    })
  }

  const scheduleValue = watch("scheduleId") ?? "default"
  const requiresConfirmation = watch("requiresConfirmation")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
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

      <div className="space-y-2">
        <Label>Availability schedule</Label>
        <Select
          value={scheduleValue}
          onValueChange={(next: string | null) => {
            if (!next) return
            setValue("scheduleId", next === "default" ? null : next, {
              shouldDirty: true,
            })
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Use my default schedule</SelectItem>
            {schedules.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.isDefault ? " (default)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bufferBefore">Buffer before (minutes)</Label>
          <Input
            id="bufferBefore"
            type="number"
            min={0}
            max={120}
            placeholder="Inherit from schedule"
            defaultValue={defaultValues.bufferBeforeMinutes ?? undefined}
            onChange={(e) =>
              setValue(
                "bufferBeforeMinutes",
                e.target.value === "" ? null : Number(e.target.value),
                {
                  shouldDirty: true,
                }
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bufferAfter">Buffer after (minutes)</Label>
          <Input
            id="bufferAfter"
            type="number"
            min={0}
            max={120}
            placeholder="Inherit from schedule"
            defaultValue={defaultValues.bufferAfterMinutes ?? undefined}
            onChange={(e) =>
              setValue(
                "bufferAfterMinutes",
                e.target.value === "" ? null : Number(e.target.value),
                {
                  shouldDirty: true,
                }
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimumNotice">Minimum notice (minutes)</Label>
          <Input
            id="minimumNotice"
            type="number"
            min={0}
            {...register("minimumNoticeMinutes", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPerDay">Max bookings per day</Label>
          <Input
            id="maxPerDay"
            type="number"
            min={1}
            placeholder="Unlimited"
            defaultValue={defaultValues.maximumBookingsPerDay ?? undefined}
            onChange={(e) =>
              setValue(
                "maximumBookingsPerDay",
                e.target.value === "" ? null : Number(e.target.value),
                {
                  shouldDirty: true,
                }
              )
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label className="text-sm">Require manual confirmation</Label>
          <p className="text-xs text-muted-foreground">
            New bookings will need your approval before they&apos;re confirmed.
          </p>
        </div>
        <Switch
          checked={requiresConfirmation}
          onCheckedChange={(v) =>
            setValue("requiresConfirmation", Boolean(v), { shouldDirty: true })
          }
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save availability settings
      </Button>
    </form>
  )
}
