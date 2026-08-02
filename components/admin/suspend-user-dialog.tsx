"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { suspendUser, reactivateUser } from "@/actions/admin.actions"

export function SuspendUserDialog({
  userId,
  userName,
  status,
}: {
  userId: string
  userName: string
  status: "ACTIVE" | "SUSPENDED"
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status === "SUSPENDED") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await reactivateUser(userId)
          })
        }
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Reactivate
      </Button>
    )
  }

  function handleSuspend() {
    startTransition(async () => {
      const res = await suspendUser(userId)
      if (res?.error) {
        setError(res.error)
        return
      }
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Suspend
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {userName}?</DialogTitle>
          <DialogDescription>
            They&apos;ll be unable to log back in until reactivated.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleSuspend}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Suspend user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
