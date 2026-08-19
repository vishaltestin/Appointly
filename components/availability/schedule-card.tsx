"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Star, Loader2, Clock } from "lucide-react"
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
    <>
      <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:border-primary/20 sm:p-5">
        <Link
          href={`/app/${orgSlug}/availability/${schedule.id}`}
          className="min-w-0 flex-1"
        >
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{schedule.name}</p>
            {schedule.isDefault && (
              <Badge className="shrink-0 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400 dark:hover:bg-amber-950/50">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Default
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {schedule.timezone}
          </p>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
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
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{schedule.name}&quot;?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All working hours and overrides will
              be lost.
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
    </>
  )
}
