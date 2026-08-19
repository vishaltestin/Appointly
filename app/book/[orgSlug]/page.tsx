import { notFound } from "next/navigation"
import Link from "next/link"
import { Clock, CalendarClock } from "lucide-react"
import { db } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

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
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Appointly</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <div className="mb-8 text-center">
          <Avatar className="mx-auto h-16 w-16">
            <AvatarImage src={organization.logo ?? undefined} />
            <AvatarFallback className="text-lg">
              {getInitials(organization.name)}
            </AvatarFallback>
          </Avatar>
          <h1 className="mt-4 text-2xl font-semibold">{organization.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose an event type to book
          </p>
        </div>

        <div className="space-y-3">
          {eventTypes.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No bookable event types available right now.
              </p>
            </div>
          ) : (
            eventTypes.map((et) => (
              <Link
                key={et.id}
                href={`/book/${orgSlug}/${et.slug}`}
                className="flex items-center justify-between rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-1.5 rounded-full"
                    style={{ backgroundColor: et.color }}
                  />
                  <div>
                    <p className="font-medium">{et.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
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
    </div>
  )
}
