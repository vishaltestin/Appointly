import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { BookingFlow } from "@/components/booking/booking-flow"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; eventSlug: string }>
}): Promise<Metadata> {
  const { orgSlug, eventSlug } = await params
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, status: true },
  })
  if (!org || org.status === "SUSPENDED") return {}
  const eventType = await db.eventType.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug: eventSlug } },
    select: { title: true },
  })
  if (!eventType) return {}
  return { title: `${eventType.title} · ${org.name}` }
}

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
    <div className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-14">
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
