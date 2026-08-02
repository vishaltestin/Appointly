import { requireOrgMembership } from "@/lib/session"
import { SettingsTabs } from "@/components/organization/settings-tabs"

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  await requireOrgMembership(orgSlug)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization and team.
        </p>
      </div>
      <SettingsTabs orgSlug={orgSlug} />
      {children}
    </div>
  )
}
