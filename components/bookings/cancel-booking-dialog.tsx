"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  cancelBookingSchema,
  type CancelBookingInput,
} from "@/lib/validations/booking-management.schema"
import { cancelBookingAsHost } from "@/actions/booking-lifecycle.actions"

export function CancelBookingDialog({
  orgSlug,
  bookingId,
  variant = "outline",
  size = "sm",
}: {
  orgSlug: string
  bookingId: string
  variant?: "outline" | "destructive" | "ghost"
  size?: "sm" | "default"
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CancelBookingInput>({
    resolver: zodResolver(cancelBookingSchema),
    defaultValues: { reason: "" },
  })

  function onSubmit(values: CancelBookingInput) {
    startTransition(async () => {
      const res = await cancelBookingAsHost(orgSlug, bookingId, {
        reason: values.reason?.trim() ? values.reason.trim() : undefined,
      })
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={variant} size={size}>
            Cancel booking
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              The attendee will be notified immediately. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {errors.root?.serverError && (
            <p className="text-sm text-destructive">
              {errors.root.serverError.message}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason (optional, shared with attendee)
            </Label>
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
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm cancellation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
