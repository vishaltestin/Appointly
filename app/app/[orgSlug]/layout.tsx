import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { OrgProvider } from "@/lib/org-context"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

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
  // updateMany keeps this a single atomic UPDATE — the adapter's
  // read-modify-write path on user.update races with concurrent RSC
  // renders (prefetches) and intermittently fails with P2039.
  await db.user.updateMany({
    where: {
      id: membership.userId,
      NOT: { lastActiveOrgId: membership.organizationId },
    },
    data: { lastActiveOrgId: membership.organizationId },
  })

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
      <SidebarProvider>
        <DashboardSidebar
          organizations={orgList}
          currentSlug={orgSlug}
          plan={membership.organization.plan}
        />
        <SidebarInset>
          <DashboardHeader
            user={{
              name: membership.user.name,
              email: membership.user.email,
              image: membership.user.image,
            }}
            isSuperAdmin={membership.user.globalRole === "SUPER_ADMIN"}
            orgSlug={orgSlug}
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </OrgProvider>
  )
}
