"use client"

import { Globe } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COMMON_TIMEZONES } from "@/lib/timezones"

export function TimezoneSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (tz: string) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(next: string | null) => {
        if (next) onChange(next)
      }}
    >
      <SelectTrigger className="w-full sm:w-64">
        <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {COMMON_TIMEZONES.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {tz}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
