import { requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import { OrgSettingsForm } from "@/components/organization/org-settings-form"
import { DangerZone } from "@/components/organization/danger-zone"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)
  const canEdit = permissions.canEditOrganization(membership.role)
  const canDelete = permissions.canDeleteOrganization(membership.role)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace profile</CardTitle>
          <CardDescription>
            Name, URL and timezone used across your booking pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm
            orgSlug={orgSlug}
            canEdit={canEdit}
            defaultValues={{
              name: membership.organization.name,
              slug: membership.organization.slug,
              timezone: membership.organization.timezone,
            }}
            appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
          />
        </CardContent>
      </Card>
      {canDelete && (
        <DangerZone orgSlug={orgSlug} orgName={membership.organization.name} />
      )}
    </div>
  )
}
