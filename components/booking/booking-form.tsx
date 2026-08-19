"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createPublicBooking } from "@/actions/booking.actions"
import { toast } from "sonner"

interface Question {
  id: string
  label: string
  type: "TEXT" | "TEXTAREA" | "PHONE"
  required: boolean
}

interface Props {
  orgSlug: string
  eventSlug: string
  eventTypeId: string
  startTimeISO: string
  timezone: string
  questions: Question[]
  onSuccess: (bookingId: string) => void
  onSlotTaken: () => void
}

interface FormValues {
  attendeeName: string
  attendeeEmail: string
  attendeeNotes: string
  [key: string]: string
}

export function BookingForm({
  orgSlug,
  eventSlug,
  eventTypeId,
  startTimeISO,
  timezone,
  questions,
  onSuccess,
  onSlotTaken,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>()

  function onSubmit(values: FormValues) {
    setError(null)
    const { attendeeName, attendeeEmail, attendeeNotes, ...rest } = values
    const responses: Record<string, string> = {}
    for (const q of questions) responses[q.id] = rest[q.id] ?? ""

    startTransition(async () => {
      const res = await createPublicBooking(orgSlug, eventSlug, {
        eventTypeId,
        startTime: new Date(startTimeISO),
        attendeeName,
        attendeeEmail,
        attendeeTimezone: timezone,
        attendeeNotes,
        responses,
      })

      if (res?.error) {
        setError(res.error)
        if (res.slotTaken) onSlotTaken()
        return
      }
      if (res?.bookingId) {
        toast.success("Booking confirmed!")
        onSuccess(res.bookingId)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="attendeeName">Name</Label>
        <Input
          id="attendeeName"
          placeholder="Your full name"
          {...register("attendeeName", { required: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="attendeeEmail">Email</Label>
        <Input
          id="attendeeEmail"
          type="email"
          placeholder="you@example.com"
          {...register("attendeeEmail", { required: true })}
        />
      </div>

      {questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={q.id}>
            {q.label}
            {q.required && <span className="text-destructive"> *</span>}
          </Label>
          {q.type === "TEXTAREA" ? (
            <Textarea id={q.id} {...register(q.id, { required: q.required })} />
          ) : (
            <Input
              id={q.id}
              type={q.type === "PHONE" ? "tel" : "text"}
              {...register(q.id, { required: q.required })}
            />
          )}
        </div>
      ))}

      <div className="space-y-2">
        <Label htmlFor="attendeeNotes">Additional notes (optional)</Label>
        <Textarea
          id="attendeeNotes"
          rows={3}
          placeholder="Anything you'd like the host to know"
          {...register("attendeeNotes")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Confirm booking
      </Button>
    </form>
  )
}
