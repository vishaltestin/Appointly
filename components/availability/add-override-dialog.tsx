"use client"

import { useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TimeSelect } from "@/components/availability/time-select"
import { addDateOverride } from "@/actions/availability.actions"

export function AddOverrideDialog({
  orgSlug,
  scheduleId,
}: {
  orgSlug: string
  scheduleId: string
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>()
  const [unavailable, setUnavailable] = useState(true)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!date) {
      setError("Pick a date first.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await addDateOverride(orgSlug, scheduleId, {
        date,
        type: unavailable ? "UNAVAILABLE" : "CUSTOM_HOURS",
        startTime: unavailable ? undefined : startTime,
        endTime: unavailable ? undefined : endTime,
        reason: reason || undefined,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      queryClient.invalidateQueries({
        queryKey: ["schedule-preview", scheduleId],
      })
      setOpen(false)
      setDate(undefined)
      setReason("")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Add date override
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a date override</DialogTitle>
          <DialogDescription>
            Block off a holiday, or set special hours for a specific date.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="unavailable-toggle" className="text-sm">
            Mark entire day unavailable
          </Label>
          <Switch
            id="unavailable-toggle"
            checked={unavailable}
            onCheckedChange={(v) => setUnavailable(Boolean(v))}
          />
        </div>

        {!unavailable && (
          <div className="flex items-center gap-2">
            <TimeSelect value={startTime} onChange={setStartTime} />
            <span className="text-sm text-muted-foreground">to</span>
            <TimeSelect value={endTime} onChange={setEndTime} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">Label (optional)</Label>
          <Input
            id="reason"
            placeholder="e.g. Christmas Day"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
