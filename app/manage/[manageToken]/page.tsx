import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ManageBookingView } from "@/components/booking/manage-booking-view"

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ manageToken: string }>
}) {
  const { manageToken } = await params

  const booking = await db.booking.findUnique({
    where: { manageToken },
    include: { rescheduledTo: { select: { manageToken: true } } },
  })
  if (!booking) notFound()

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <ManageBookingView
        booking={{
          manageToken: booking.manageToken,
          eventTitle: booking.eventTitle,
          durationMinutes: booking.durationMinutes,
          startTime: booking.startTime,
          status: booking.status,
          hostName: booking.hostName,
          cancelledBy: booking.cancelledBy,
          cancellationReason: booking.cancellationReason,
        }}
        rescheduledToManageToken={booking.rescheduledTo?.manageToken ?? null}
      />
    </div>
  )
}
