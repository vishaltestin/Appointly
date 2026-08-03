"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  CalendarCheck,
  Clock,
  Loader2,
  XCircle,
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
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isPast = booking.startTime < new Date()
  const canCancel = (status === "CONFIRMED" || status === "PENDING") && !isPast
  const canReschedule = status === "CONFIRMED" && !isPast
  const wasRescheduled = !!rescheduledToManageToken

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const res = await cancelBookingAsAttendee(booking.manageToken, {
        reason: reason || undefined,
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
    <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
      <div className="text-center">
        {status === "CANCELLED" ? (
          <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        ) : (
          <CalendarCheck className="mx-auto h-10 w-10 text-primary" />
        )}
        <h1 className="mt-3 text-lg font-semibold">{booking.eventTitle}</h1>
        <p className="text-sm text-muted-foreground">with {booking.hostName}</p>
      </div>

      <div className="mt-6 space-y-2 rounded-lg bg-muted p-4 text-sm">
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {format(booking.startTime, "EEEE, MMMM d, yyyy · h:mm a")} (
          {booking.durationMinutes} min)
        </p>
      </div>

      {status === "PENDING" && (
        <Alert className="mt-4">
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
        <div className="mt-6">
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
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={handleCancel}
                  >
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  )
}
