"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RescheduleFlow } from "@/components/booking/reschedule-flow"
import {
  getHostRescheduleSlots,
  rescheduleBookingAsHost,
} from "@/actions/reschedule.actions"

export function RescheduleBookingDialog({
  orgSlug,
  bookingId,
}: {
  orgSlug: string
  bookingId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Reschedule</Button>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule booking</DialogTitle>
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
            if (res?.error) return { error: res.error }
            setOpen(false)
            if (res?.newBookingId)
              router.push(`/app/${orgSlug}/bookings/${res.newBookingId}`)
            router.refresh()
            return {}
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
