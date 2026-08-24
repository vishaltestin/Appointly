"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
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
import { deleteOrganization } from "@/actions/organization.actions"

export function DangerZone({
  orgSlug,
  orgName,
}: {
  orgSlug: string
  orgName: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const confirmSchema = z.object({
    confirm: z.literal(orgName, {
      error: `Type "${orgName}" to confirm.`,
    }),
  })

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<{ confirm: string }>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { confirm: "" },
  })

  const confirmText = watch("confirm")

  function onSubmit() {
    startTransition(async () => {
      const res = await deleteOrganization(orgSlug)
      // Success redirects away; only a failure lands back here.
      if (res?.error)
        setError("root.serverError", { message: res.error })
    })
  }

  return (
    <div className="rounded-xl border border-destructive/25 bg-card p-6 shadow-xs">
      <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete this workspace and all of its data. This cannot be
        undone.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="destructive" className="mt-4">
              Delete workspace
            </Button>
          }
        />
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Delete {orgName}?</DialogTitle>
              <DialogDescription>
                This will permanently delete the workspace, its members, and
                all associated data. Type{" "}
                <span className="font-semibold">{orgName}</span> to confirm.
              </DialogDescription>
            </DialogHeader>
            {errors.root?.serverError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {errors.root.serverError.message}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="confirm">Workspace name</Label>
              <Input
                id="confirm"
                aria-invalid={!!errors.confirm}
                autoComplete="off"
                {...register("confirm")}
              />
              {errors.confirm && (
                <p className="text-sm text-destructive">
                  {errors.confirm.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                variant="destructive"
                disabled={confirmText !== orgName || isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete permanently
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
