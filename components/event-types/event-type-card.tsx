"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Clock, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CopyLinkButton } from "@/components/event-types/copy-link-button"
import {
  toggleEventTypeActive,
  deleteEventType,
} from "@/actions/event-type.actions"

interface EventTypeCardProps {
  orgSlug: string
  eventType: {
    id: string
    title: string
    slug: string
    durationMinutes: number
    color: string
    isActive: boolean
    requiresConfirmation: boolean
  }
}

export function EventTypeCard({ orgSlug, eventType }: EventTypeCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/book/${orgSlug}/${eventType.slug}`
      : `/book/${orgSlug}/${eventType.slug}`

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      await toggleEventTypeActive(orgSlug, eventType.id, checked)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteEventType(orgSlug, eventType.id)
      if (res?.error) {
        setError(res.error)
        return
      }
      setConfirmDelete(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <span
          className="h-10 w-1.5 rounded-full"
          style={{ backgroundColor: eventType.color }}
        />
        <div>
          <Link
            href={`/app/${orgSlug}/event-types/${eventType.id}`}
            className="font-medium hover:underline"
          >
            {eventType.title}
          </Link>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {eventType.durationMinutes} min
          </p>
        </div>
        {!eventType.isActive && <Badge variant="outline">Hidden</Badge>}
        {eventType.requiresConfirmation && <Badge variant="outline">Requires approval</Badge>}

      </div>

      <div className="flex items-center gap-2">
        <CopyLinkButton url={publicUrl} />
        <Switch
          checked={eventType.isActive}
          onCheckedChange={(v) => handleToggle(Boolean(v))}
          disabled={isPending}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={
                <Link href={`/app/${orgSlug}/event-types/${eventType.id}`}>
                  Edit
                </Link>
              }
            />
            <DropdownMenuItem
              render={
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  Preview
                </a>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{eventType.title}&quot;?</DialogTitle>
            <DialogDescription>
              Past bookings are kept for your records, but this link stops
              working immediately.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
