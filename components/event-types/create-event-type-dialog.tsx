"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createEventType } from "@/actions/event-type.actions"

export function CreateEventTypeDialog({
  orgSlug,
  disabled = false,
}: {
  orgSlug: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await createEventType(orgSlug, { title: title.trim() })
      if (res?.error) {
        setError(res.error)
        return
      }
      setOpen(false)
      setTitle("")
      if (res?.eventTypeId)
        router.push(`/app/${orgSlug}/event-types/${res.eventTypeId}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button disabled={disabled}>
            <Plus className="mr-2 h-4 w-4" />
            New event type
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an event type</DialogTitle>
          <DialogDescription>
            This becomes a bookable link you can share with clients.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            placeholder="e.g. 30 Minute Consultation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
