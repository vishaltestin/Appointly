import { db } from "@/lib/db"
import { requireOrgMembership } from "@/lib/session"
import { OrgProvider } from "@/lib/org-context"
import { AppSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

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
      <SidebarProvider>
        <AppSidebar
          organizations={orgList}
          currentSlug={orgSlug}
          plan={membership.organization.plan}
          user={{
            name: membership.user.name,
            email: membership.user.email,
            image: membership.user.image,
          }}
          isSuperAdmin={membership.user.globalRole === "SUPER_ADMIN"}
        />
        <SidebarInset>
          <DashboardHeader
            user={{
              name: membership.user.name,
              email: membership.user.email,
              image: membership.user.image,
            }}
            isSuperAdmin={membership.user.globalRole === "SUPER_ADMIN"}
          />
          <main className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgProvider>
  )
}
