import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

interface DashboardHeaderProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isSuperAdmin?: boolean
}

export function DashboardHeader({ user, isSuperAdmin }: DashboardHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-between">
        <div />
        <ThemeToggle />
      </div>
    </header>
  )
}
