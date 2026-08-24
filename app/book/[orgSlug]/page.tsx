import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CalendarClock, Clock } from "lucide-react"
import { db } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { EmptyState } from "@/components/shared/empty-state"

const LOCATION_LABELS: Record<string, string> = {
  IN_PERSON: "In person",
  PHONE_CALL: "Phone call",
  ONLINE_MEETING: "Online meeting",
  CUSTOM: "Custom",
}

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
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:py-16">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="rounded-[1.25rem] bg-card p-2 shadow-lg shadow-foreground/5 ring-1 ring-foreground/10">
          <Avatar className="size-16 rounded-2xl">
            <AvatarImage src={organization.logo ?? undefined} />
            <AvatarFallback className="rounded-2xl bg-primary/10 text-lg font-semibold text-primary dark:bg-primary/20">
              {getInitials(organization.name)}
            </AvatarFallback>
          </Avatar>
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          {organization.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose a meeting below — you&apos;ll see real-time availability in
          your own time zone.
        </p>
      </div>

      {eventTypes.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing to book right now"
          description="This workspace doesn't have any bookable event types at the moment."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {eventTypes.map((et) => (
            <Link
              key={et.id}
              href={`/book/${orgSlug}/${et.slug}`}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-foreground/15"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: et.color }}
              />
              <div className="flex items-start justify-between gap-2 pt-1">
                <h2 className="font-semibold tracking-tight">{et.title}</h2>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-px" />
                </span>
              </div>
              {et.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {et.description}
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Clock className="size-3.5 shrink-0" />
                  {et.durationMinutes} min
                </span>
                <span className="text-foreground/25">·</span>
                <span className="whitespace-nowrap">
                  {LOCATION_LABELS[et.locationType] ?? "Meeting"}
                </span>
                <span className="text-foreground/25">·</span>
                <span className="truncate">{et.membership.user.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
