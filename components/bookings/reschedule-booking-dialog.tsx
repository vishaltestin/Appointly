"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RescheduleFlow } from "@/components/booking/reschedule-flow"
import {
  getHostRescheduleSlots,
  rescheduleBookingAsHost,
} from "@/actions/booking-management.actions"

export function RescheduleBookingDialog({
  orgSlug,
  bookingId,
}: {
  orgSlug: string
  bookingId: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Reschedule</Button>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule booking</DialogTitle>
          <DialogDescription>
            Pick a new date and time. The attendee will be notified.
          </DialogDescription>
        </DialogHeader>
        <RescheduleFlow
          queryKeyPrefix={`host-reschedule-${bookingId}`}
          fetchSlots={(s, e) =>
            getHostRescheduleSlots(orgSlug, bookingId, s, e)
          }
          onConfirm={async (newStartTimeISO) => {
            const res = await rescheduleBookingAsHost(
              orgSlug,
              bookingId,
              newStartTimeISO
            )
            if (res.error) return { error: res.error }
            setOpen(false)
            queryClient.invalidateQueries({
              queryKey: ["bookings"],
            })
            router.refresh()
            return {}
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
