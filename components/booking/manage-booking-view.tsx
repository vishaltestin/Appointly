"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
  CalendarCheck,
  CalendarX2,
  Clock,
  Hourglass,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RescheduleFlow } from "@/components/booking/reschedule-flow"
import { cn } from "@/lib/utils"
import {
  cancelBookingSchema,
  type CancelBookingInput,
} from "@/lib/validations/booking-management.schema"
import {
  cancelBookingAsAttendee,
  getAttendeeRescheduleSlots,
  rescheduleBookingAsAttendee,
} from "@/actions/booking-lifecycle.actions"

interface Props {
  booking: {
    manageToken: string
    eventTitle: string
    durationMinutes: number
    startTime: Date
    status: "PENDING" | "CONFIRMED" | "CANCELLED"
    hostName: string
    cancelledBy: "HOST" | "ATTENDEE" | null
    cancellationReason: string | null
  }
  rescheduledToManageToken: string | null
}

export function ManageBookingView({
  booking,
  rescheduledToManageToken,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(booking.status)
  const [cancelledBy, setCancelledBy] = useState(booking.cancelledBy)
  const [mode, setMode] = useState<"view" | "reschedule">("view")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelBookingInput>({
    resolver: zodResolver(cancelBookingSchema),
    defaultValues: { reason: "" },
  })

  const isPast = booking.startTime < new Date()
  const canCancel = (status === "CONFIRMED" || status === "PENDING") && !isPast
  const canReschedule = status === "CONFIRMED" && !isPast
  const wasRescheduled = !!rescheduledToManageToken

  function onCancelSubmit(values: CancelBookingInput) {
    setError(null)
    startTransition(async () => {
      const res = await cancelBookingAsAttendee(booking.manageToken, {
        reason: values.reason?.trim() ? values.reason.trim() : undefined,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      setStatus("CANCELLED")
      setCancelledBy("ATTENDEE")
      setDialogOpen(false)
    })
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border bg-card p-6 shadow-lg shadow-foreground/5 transition-[max-width] duration-300 sm:p-10",
        mode === "reschedule" ? "max-w-3xl" : "max-w-md"
      )}
    >
      <div className="text-center">
        {status === "CANCELLED" ? (
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted ring-4 ring-muted/40">
            <CalendarX2 className="size-6 text-muted-foreground" />
          </span>
        ) : status === "PENDING" ? (
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/10 ring-4 ring-amber-500/5">
            <Hourglass className="size-6 text-amber-600 dark:text-amber-400" />
          </span>
        ) : (
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
            <CalendarCheck className="size-6 text-primary" />
          </span>
        )}
        <h1 className="mt-3 text-lg font-semibold">{booking.eventTitle}</h1>
        <p className="text-sm text-muted-foreground">with {booking.hostName}</p>
      </div>

      <div className="mt-6 flex items-center gap-2.5 rounded-lg bg-muted/70 px-4 py-3 text-sm">
        <Clock className="size-4 shrink-0 text-muted-foreground" />
        <span>
          {format(booking.startTime, "EEEE, MMMM d, yyyy · h:mm a")} (
          {booking.durationMinutes} min)
        </span>
      </div>

      {status === "PENDING" && (
        <Alert className="mt-4 border-amber-500/30 bg-amber-500/5">
          <AlertDescription>
            This booking is awaiting approval from {booking.hostName}.
            You&apos;ll receive an email once it&apos;s confirmed.
          </AlertDescription>
        </Alert>
      )}

      {wasRescheduled ? (
        <Alert className="mt-4">
          <AlertDescription className="flex flex-wrap items-center gap-1">
            This booking was rescheduled.
            <Link
              href={`/manage/${rescheduledToManageToken}`}
              className="inline-flex items-center gap-1 font-medium underline"
            >
              View new time <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </AlertDescription>
        </Alert>
      ) : status === "CANCELLED" ? (
        <Alert className="mt-4">
          <AlertDescription>
            This booking was cancelled
            {cancelledBy
              ? ` by ${cancelledBy === "HOST" ? booking.hostName : "you"}`
              : ""}
            .{booking.cancellationReason && ` "${booking.cancellationReason}"`}
          </AlertDescription>
        </Alert>
      ) : null}

      {isPast && status === "CONFIRMED" && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          This booking has already taken place.
        </p>
      )}

      {mode === "reschedule" && canReschedule && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-base font-semibold tracking-tight">
            Pick a new time
          </h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Your booking moves as soon as you confirm — a fresh confirmation
            lands in your inbox.
          </p>
          <RescheduleFlow
            queryKeyPrefix={`attendee-reschedule-${booking.manageToken}`}
            fetchSlots={(s, e) =>
              getAttendeeRescheduleSlots(booking.manageToken, s, e)
            }
            onConfirm={async (newStartTimeISO) => {
              const res = await rescheduleBookingAsAttendee(
                booking.manageToken,
                newStartTimeISO
              )
              if (res.error) return { error: res.error }
              router.push(`/manage/${res.newManageToken}`)
              return {}
            }}
            onCancel={() => setMode("view")}
          />
        </div>
      )}

      {mode === "view" && (canCancel || canReschedule) && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {canReschedule && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setMode("reschedule")}
            >
              Reschedule
            </Button>
          )}
          {canCancel && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="destructive" className="flex-1">
                    {status === "PENDING" ? "Withdraw request" : "Cancel"}
                  </Button>
                }
              />
              <DialogContent>
                <form onSubmit={handleSubmit(onCancelSubmit)}>
                  <DialogHeader>
                    <DialogTitle>
                      {status === "PENDING"
                        ? "Withdraw this request?"
                        : "Cancel this booking?"}
                    </DialogTitle>
                    <DialogDescription>
                      {booking.hostName} will be notified immediately.
                    </DialogDescription>
                  </DialogHeader>
                  {error && (
                    <p className="mt-3 text-sm text-destructive">{error}</p>
                  )}
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Textarea
                      id="reason"
                      rows={3}
                      aria-invalid={!!errors.reason}
                      {...register("reason")}
                    />
                    {errors.reason && (
                      <p className="text-sm text-destructive">
                        {errors.reason.message}
                      </p>
                    )}
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit" variant="destructive" disabled={isPending}>
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirm
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  )
}
