"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const res = await approveBooking(orgSlug, bookingId)
      if (res?.error) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function handleDecline() {
    setError(null)
    startTransition(async () => {
      const res = await declineBooking(orgSlug, bookingId, {
        reason: reason || undefined,
      })
      if (res?.error) {
        setError(res.error)
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
          <DialogHeader>
            <DialogTitle>Decline this booking request?</DialogTitle>
            <DialogDescription>
              The attendee will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDecline}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
