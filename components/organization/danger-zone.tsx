"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteOrganization } from "@/actions/organization.actions"

export function DangerZone({
  orgSlug,
  orgName,
}: {
  orgSlug: string
  orgName: string
}) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteOrganization(orgSlug)
    })
  }

  return (
    <div className="rounded-lg border border-destructive/30 p-5">
      <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete this workspace and all of its data. This cannot be
        undone.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="text-destructive-foreground mt-4 inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/90">
          Delete workspace
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {orgName}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the workspace, its members, and all
              associated data. Type{" "}
              <span className="font-semibold">{orgName}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm">Workspace name</Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={confirmText !== orgName || isPending}
              onClick={handleDelete}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
