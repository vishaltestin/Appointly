"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

/**
 * Debounced search — without the debounce every keystroke pushed a new URL
 * and fired a server round-trip, spamming history and the DB.
 */
export function CustomerSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(defaultValue ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local state in sync when arriving via a different search URL —
  // adjust during render instead of in an effect (react.dev docs pattern).
  const [prevDefault, setPrevDefault] = useState(defaultValue)
  if (prevDefault !== defaultValue) {
    setPrevDefault(defaultValue)
    setValue(defaultValue ?? "")
  }

  useEffect(() => {
    if (value === (defaultValue ?? "")) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("search", value)
      } else {
        params.delete("search")
      }
      params.delete("page") // reset to page 1 on new search
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false })
      })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
        aria-label="Search customers"
      />
    </div>
  )
}
