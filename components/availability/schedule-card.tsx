"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Star, Loader2 } from "lucide-react"
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
import {
  setDefaultSchedule,
  deleteSchedule,
} from "@/actions/availability.actions"

interface ScheduleCardProps {
  orgSlug: string
  schedule: { id: string; name: string; timezone: string; isDefault: boolean }
}

export function ScheduleCard({ orgSlug, schedule }: ScheduleCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSetDefault() {
    startTransition(async () => {
      await setDefaultSchedule(orgSlug, schedule.id)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteSchedule(orgSlug, schedule.id)
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
      <Link
        href={`/app/${orgSlug}/availability/${schedule.id}`}
        className="flex-1"
      >
        <div className="flex items-center gap-2">
          <p className="font-medium">{schedule.name}</p>
          {schedule.isDefault && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Default
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{schedule.timezone}</p>
      </Link>

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
              <Link href={`/app/${orgSlug}/availability/${schedule.id}`}>
                Edit
              </Link>
            }
          />
          {!schedule.isDefault && (
            <DropdownMenuItem onClick={handleSetDefault} disabled={isPending}>
              Set as default
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{schedule.name}&quot;?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
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
