import { requireSuperAdmin } from "@/lib/session"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireSuperAdmin()

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <DashboardHeader
          user={{ name: admin.name, email: admin.email, image: admin.image }}
        />
        <main className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
