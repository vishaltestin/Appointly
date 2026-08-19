import { notFound } from "next/navigation"
import Link from "next/link"
import { Clock } from "lucide-react"
import { db } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

export default async function OrgBookingProfilePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
  })
  if (!organization || organization.status === "SUSPENDED") notFound()

  const eventTypes = await db.eventType.findMany({
    where: {
      organizationId: organization.id,
      isActive: true,
      membership: { user: { status: "ACTIVE" } },
    },
    include: { membership: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 text-center">
        <Avatar className="mx-auto h-16 w-16">
          <AvatarImage src={organization.logo ?? undefined} />
          <AvatarFallback className="text-lg">
            {getInitials(organization.name)}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-2xl font-semibold">{organization.name}</h1>
      </div>

      <div className="space-y-3">
        {eventTypes.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No bookable event types available right now.
          </p>
        ) : (
          eventTypes.map((et) => (
            <Link
              key={et.id}
              href={`/book/${orgSlug}/${et.slug}`}
              className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-8 w-1.5 rounded-full"
                  style={{ backgroundColor: et.color }}
                />
                <div>
                  <p className="font-medium">{et.title}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {et.durationMinutes} min · with {et.membership.user.name}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
