import Link from "next/link"
import { Settings, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getInitials } from "@/lib/utils"
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeaderBreadcrumb } from "@/components/layout/header-breadcrumb"

interface DashboardHeaderProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isSuperAdmin?: boolean
  orgSlug: string
}

export function DashboardHeader({
  user,
  isSuperAdmin,
  orgSlug,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 data-[orientation=vertical]:h-5"
        />
        <div className="hidden min-w-0 sm:block">
          <HeaderBreadcrumb />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="flex items-center gap-2 rounded-full outline-none ring-ring/50 focus-visible:ring-2"
                aria-label="Account menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={
                  <Link href={`/app/${orgSlug}/settings/general`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Workspace settings
                  </Link>
                }
              />
              {isSuperAdmin && (
                <DropdownMenuItem
                  render={
                    <Link href="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Platform admin
                    </Link>
                  }
                />
              )}
              <DropdownMenuSeparator />
              <SignOutMenuItem />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
