"use client"

import { useEffect } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Brand } from "@/components/layout/brand"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6 text-center">
      <Brand />
      <div className="space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. Your data is safe — try again, and
          contact support if it keeps happening.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
