"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Loader2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SignOutButtonProps {
  variant?:
    "default" | "outline" | "ghost" | "destructive" | "secondary" | "link"
  className?: string
  callbackUrl?: string
}

export function SignOutButton({
  variant = "outline",
  className,
  callbackUrl = "/login",
}: SignOutButtonProps) {
  const [isPending, setIsPending] = useState(false)

  async function handleSignOut() {
    setIsPending(true)
    // redirect: false + a hard `window.location` navigation (instead of
    // next/navigation's router) guarantees every server component
    // re-evaluates the session fresh on the next page load — this is what
    // prevents "logged in as the wrong account" artifacts after switching.
    await signOut({ redirect: false })
    window.location.href = callbackUrl
  }

  return (
    <Button
      variant={variant}
      className={cn(className)}
      disabled={isPending}
      onClick={handleSignOut}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      Log out
    </Button>
  )
}
