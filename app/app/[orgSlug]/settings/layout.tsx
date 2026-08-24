import { redirect } from "next/navigation"
import { requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import { SettingsTabs } from "@/components/organization/settings-tabs"

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)

  // Workspace settings are administration, not scheduling — a MEMBER runs
  // their own calendar (event types, availability, own bookings) and never
  // needs this section. Gate here, not just in the sidebar: the sidebar only
  // hides the link, this enforces it for hand-typed URLs too.
  if (!permissions.canEditOrganization(membership.role)) {
    redirect(`/app/${orgSlug}/dashboard`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization, team, and subscription.
        </p>
      </div>

      <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
        <SettingsTabs orgSlug={orgSlug} />
        <div className="mt-6 min-w-0 md:mt-0">{children}</div>
      </div>
    </div>
  )
}
