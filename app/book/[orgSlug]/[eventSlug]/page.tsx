import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { BookingFlow } from "@/components/booking/booking-flow"

export default async function EventBookingPage({
  params,
}: {
  params: Promise<{ orgSlug: string; eventSlug: string }>
}) {
  const { orgSlug, eventSlug } = await params

  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
  })
  if (!organization || organization.status === "SUSPENDED") notFound()

  const eventType = await db.eventType.findUnique({
    where: {
      organizationId_slug: { organizationId: organization.id, slug: eventSlug },
    },
    include: {
      membership: { include: { user: true } },
      questions: { orderBy: { order: "asc" } },
    },
  })

  if (
    !eventType ||
    !eventType.isActive ||
    eventType.membership.user.status === "SUSPENDED"
  )
    notFound()

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <BookingFlow
        orgSlug={orgSlug}
        eventType={{
          id: eventType.id,
          slug: eventType.slug,
          title: eventType.title,
          description: eventType.description,
          durationMinutes: eventType.durationMinutes,
          color: eventType.color,
          locationType: eventType.locationType,
          locationValue: eventType.locationValue,
          questions: eventType.questions,
        }}
        host={{
          name: eventType.membership.user.name ?? "Host",
          image: eventType.membership.user.image,
        }}
      />
    </div>
  )
}
