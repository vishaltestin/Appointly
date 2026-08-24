"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const OPTIONS = [
  { value: "lastBookingAt:desc", label: "Recently booked" },
  { value: "totalBookings:desc", label: "Most bookings" },
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "email:asc", label: "Email (A–Z)" },
]

export function CustomerSortSelect({
  sort,
  order,
}: {
  sort: string
  order: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = `${sort}:${order}`

  function handleChange(next: string | null) {
    if (!next) return
    const [nextSort, nextOrder] = next.split(":")
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", nextSort)
    params.set("order", nextOrder)
    params.delete("page")
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-48" aria-label="Sort customers">
        <span className="flex items-center gap-2">
          <ArrowUpDown className="size-3.5 text-muted-foreground" />
          <SelectValue>
            {(v) => OPTIONS.find((o) => o.value === v)?.label ?? "Sort by"}
          </SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
