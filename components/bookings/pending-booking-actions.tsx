"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  cancelBookingSchema,
  type CancelBookingInput,
} from "@/lib/validations/booking-management.schema"
import {
  approveBooking,
  declineBooking,
} from "@/actions/booking-lifecycle.actions"

export function PendingBookingActions({
  orgSlug,
  bookingId,
  size = "sm",
}: {
  orgSlug: string
  bookingId: string
  size?: "sm" | "default"
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [declineOpen, setDeclineOpen] = useState(false)
  const [error, setApproveError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CancelBookingInput>({
    resolver: zodResolver(cancelBookingSchema),
    defaultValues: { reason: "" },
  })

  function handleApprove() {
    setApproveError(null)
    startTransition(async () => {
      const res = await approveBooking(orgSlug, bookingId)
      if (res?.error) {
        setApproveError(res.error)
        return
      }
      router.refresh()
    })
  }

  function onDecline(values: CancelBookingInput) {
    startTransition(async () => {
      const res = await declineBooking(orgSlug, bookingId, {
        reason: values.reason?.trim() ? values.reason.trim() : undefined,
      })
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      setDeclineOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          size={size}
          variant="outline"
          disabled={isPending}
          onClick={handleApprove}
        >
          <Check className="mr-1.5 h-4 w-4" />
          Approve
        </Button>
        <Button
          size={size}
          variant="destructive"
          disabled={isPending}
          onClick={() => setDeclineOpen(true)}
        >
          <X className="mr-1.5 h-4 w-4" />
          Decline
        </Button>
      </div>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit(onDecline)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Decline this booking request?</DialogTitle>
              <DialogDescription>
                The attendee will be notified.
              </DialogDescription>
            </DialogHeader>
            {errors.root?.serverError && (
              <p className="text-sm text-destructive">
                {errors.root.serverError.message}
              </p>
            )}
            <div>
              <Textarea
                placeholder="Reason (optional)"
                rows={3}
                aria-invalid={!!errors.reason}
                {...register("reason")}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.reason.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Decline
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
