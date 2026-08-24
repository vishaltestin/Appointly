import { PublicFrame } from "@/components/booking/public-frame"

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicFrame>{children}</PublicFrame>
}
