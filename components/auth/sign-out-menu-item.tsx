"use client"

import { useTransition } from "react"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function SignOutMenuItem() {
  const [, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut({ redirect: false })
      window.location.href = "/login"
    })
  }

  return (
    <DropdownMenuItem
      className="text-destructive focus:text-destructive"
      onClick={handleSignOut}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </DropdownMenuItem>
  )
}
