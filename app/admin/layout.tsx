import { requireSuperAdmin } from "@/lib/session"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireSuperAdmin()

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader
          admin={{ name: admin.name, email: admin.email, image: admin.image }}
        />
        <main className="flex-1 bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  )
}
