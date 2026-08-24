"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Star, Loader2, Globe, CalendarDays } from "lucide-react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  setDefaultSchedule,
  deleteSchedule,
} from "@/actions/availability.actions"

interface ScheduleCardProps {
  orgSlug: string
  schedule: {
    id: string
    name: string
    timezone: string
    isDefault: boolean
    summary?: string
    eventTypeCount?: number
  }
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
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.07] text-primary ring-1 ring-primary/15 dark:bg-primary/10">
        <CalendarDays className="size-5" />
      </span>
      <Link
        href={`/app/${orgSlug}/availability/${schedule.id}`}
        className="min-w-0 flex-1"
      >
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{schedule.name}</p>
          {schedule.isDefault && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Default
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          {schedule.summary && <span>{schedule.summary}</span>}
          <span className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            {schedule.timezone}
          </span>
          {typeof schedule.eventTypeCount === "number" && (
            <span>
              {schedule.eventTypeCount} event type
              {schedule.eventTypeCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
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

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{schedule.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the schedule and its working hours.
              Event types using it fall back to your default schedule. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep schedule</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
