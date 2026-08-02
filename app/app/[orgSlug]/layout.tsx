import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { OrgProvider } from "@/lib/org-context"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)

  const organizations = await db.membership.findMany({
    where: { userId: membership.userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  })

  // Track most recently visited org for the /app default redirect.
  if (membership.user.lastActiveOrgId !== membership.organizationId) {
    await db.user.update({
      where: { id: membership.userId },
      data: { lastActiveOrgId: membership.organizationId },
    })
  }

  const orgList = organizations.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logo: m.organization.logo,
    role: m.role,
  }))

  return (
    <OrgProvider
      value={{
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
          logo: membership.organization.logo,
          timezone: membership.organization.timezone,
        },
        role: membership.role,
      }}
    >
      <div className="flex min-h-screen">
        <DashboardSidebar organizations={orgList} currentSlug={orgSlug} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader
            user={{
              name: membership.user.name,
              email: membership.user.email,
              image: membership.user.image,
            }}
            isSuperAdmin={membership.user.globalRole === "SUPER_ADMIN"}
          />
          <main className="flex-1 bg-muted/30 p-6">{children}</main>
        </div>
      </div>
    </OrgProvider>
  )
}
