import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item"
import { ThemeToggle } from "@/components/theme-toggle"

export function AdminHeader({
  admin,
}: {
  admin: { name?: string | null; email?: string | null; image?: string | null }
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <p className="text-sm text-muted-foreground">
        Platform-wide administration
      </p>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={admin.image ?? undefined} />
                  <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="truncate text-sm font-medium">{admin.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {admin.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <SignOutMenuItem />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
