import { requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import { OrgSettingsForm } from "@/components/organization/org-settings-form"
import { DangerZone } from "@/components/organization/danger-zone"

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
    <div className="space-y-10">
      <OrgSettingsForm
        orgSlug={orgSlug}
        canEdit={canEdit}
        defaultValues={{
          name: membership.organization.name,
          slug: membership.organization.slug,
          timezone: membership.organization.timezone,
        }}
      />
      {canDelete && (
        <DangerZone orgSlug={orgSlug} orgName={membership.organization.name} />
      )}
    </div>
  )
}
