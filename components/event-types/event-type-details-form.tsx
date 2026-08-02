"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  eventTypeDetailsSchema,
  type EventTypeDetailsInput,
} from "@/lib/validations/event-type.schema"
import { updateEventTypeDetails } from "@/actions/event-type.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  defaultValues: EventTypeDetailsInput
}

const LOCATION_LABELS: Record<string, string> = {
  IN_PERSON: "In-person",
  PHONE_CALL: "Phone call",
  ONLINE_MEETING: "Online meeting (link)",
  CUSTOM: "Custom",
}

const LOCATION_PLACEHOLDER: Record<string, string> = {
  IN_PERSON: "123 Main St, Suite 100",
  PHONE_CALL: "+1 (555) 000-0000",
  ONLINE_MEETING: "https://meet.google.com/...",
  CUSTOM: "Details for your attendee",
}

const DURATION_PRESETS = [15, 30, 45, 60, 90]

export function EventTypeDetailsForm({
  orgSlug,
  eventTypeId,
  defaultValues,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventTypeDetailsInput>({
    resolver: zodResolver(eventTypeDetailsSchema),
    defaultValues,
  })

  const locationType = watch("locationType")

  function onSubmit(values: EventTypeDetailsInput) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await updateEventTypeDetails(orgSlug, eventTypeId, values)
      if (res?.error) {
        setError(res.error)
        return
      }
      setSuccess(res?.success ?? "Saved.")
      router.refresh()
    })
  }

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
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Booking link</Label>
        <div className="flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring">
          <span className="pl-3 text-sm text-muted-foreground">
            /book/{orgSlug}/
          </span>
          <Input
            id="slug"
            className="border-0 focus-visible:ring-0"
            {...register("slug")}
          />
        </div>
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...register("description")} />
      </div>

      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="flex flex-wrap items-center gap-2">
          {DURATION_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={
                watch("durationMinutes") === preset ? "default" : "outline"
              }
              size="sm"
              onClick={() =>
                setValue("durationMinutes", preset, { shouldDirty: true })
              }
            >
              {preset} min
            </Button>
          ))}
          <Input
            type="number"
            className="w-24"
            min={5}
            max={480}
            value={watch("durationMinutes")}
            onChange={(e) =>
              setValue("durationMinutes", Number(e.target.value), {
                shouldDirty: true,
              })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Location type</Label>
          <Select
            value={locationType}
            onValueChange={(next: string | null) => {
              if (next)
                setValue(
                  "locationType",
                  next as EventTypeDetailsInput["locationType"],
                  { shouldDirty: true }
                )
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationValue">Location details</Label>
          <Input
            id="locationValue"
            placeholder={LOCATION_PLACEHOLDER[locationType]}
            {...register("locationValue")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          type="color"
          className="h-10 w-20 p-1"
          {...register("color")}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save details
      </Button>
    </form>
  )
}
