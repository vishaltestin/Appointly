"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function CustomerSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("search", value)
      } else {
        params.delete("search")
      }
      params.delete("page") // reset to page 1 on new search
      startTransition(() => {
        router.push(`?${params.toString()}`)
      })
    },
    [router, searchParams, startTransition]
  )

  return (
    <div className="relative max-w-sm">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by name or email…"
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
