import { PublicFrame } from "@/components/booking/public-frame"

/**
 * Public booking pages have no app chrome on purpose — nothing should
 * distract an attendee from picking a time.
 */
export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicFrame>{children}</PublicFrame>
}
