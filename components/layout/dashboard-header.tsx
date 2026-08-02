import Link from "next/link"
import { User as UserIcon, ShieldCheck } from "lucide-react"
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
import { getInitials } from "@/lib/utils"
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item"

interface DashboardHeaderProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isSuperAdmin?: boolean
}

export function DashboardHeader({ user, isSuperAdmin }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2 rounded-full">
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
            <DropdownMenuItem>
              <Link href="/account">
                <UserIcon className="mr-2 h-4 w-4" />
                Account settings
              </Link>
            </DropdownMenuItem>
            {isSuperAdmin && (
              <DropdownMenuItem>
                <Link href="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Platform admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <SignOutMenuItem />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
