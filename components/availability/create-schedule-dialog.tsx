"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { COMMON_TIMEZONES } from "@/lib/timezones"
import { createSchedule } from "@/actions/availability.actions"

export function CreateScheduleDialog({
  orgSlug,
  existingSchedules,
  defaultTimezone,
}: {
  orgSlug: string
  existingSchedules: { id: string; name: string }[]
  defaultTimezone: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [timezone, setTimezone] = useState(defaultTimezone)
  const [copyFrom, setCopyFrom] = useState<string>("blank")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) {
      setError("Name is required.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await createSchedule(orgSlug, {
        name: name.trim(),
        timezone,
        copyFromScheduleId: copyFrom === "blank" ? undefined : copyFrom,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      setOpen(false)
      setName("")
      if (res?.scheduleId) {
        router.push(`/app/${orgSlug}/availability/${res.scheduleId}`)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New schedule
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a schedule</DialogTitle>
          <DialogDescription>
            Use different schedules for different types of meetings or working
            arrangements.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="schedule-name">Name</Label>
          <Input
            id="schedule-name"
            placeholder="e.g. Evening hours"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select
            value={timezone}
            onValueChange={(next: string | null) => {
              if (next) setTimezone(next)
            }}
          >
            <SelectTrigger>
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
        </div>

        {existingSchedules.length > 0 && (
          <div className="space-y-2">
            <Label>Start from</Label>
            <Select
              value={copyFrom}
              onValueChange={(next: string | null) => {
                if (next) setCopyFrom(next)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">
                  Default hours (Mon–Fri, 9–5)
                </SelectItem>
                {existingSchedules.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    Copy from &quot;{s.name}&quot;
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
