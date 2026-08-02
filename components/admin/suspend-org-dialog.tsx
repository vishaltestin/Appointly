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
import {
  suspendOrganization,
  reactivateOrganization,
} from "@/actions/admin.actions"

export function SuspendOrgDialog({
  orgId,
  orgName,
  status,
}: {
  orgId: string
  orgName: string
  status: "ACTIVE" | "SUSPENDED"
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (status === "SUSPENDED") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await reactivateOrganization(orgId)
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
      await suspendOrganization(orgId)
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
          <DialogTitle>Suspend {orgName}?</DialogTitle>
          <DialogDescription>
            Members will lose access to this workspace immediately. This can be
            reversed at any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleSuspend}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Suspend workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
