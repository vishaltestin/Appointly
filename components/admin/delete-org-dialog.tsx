"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { deleteOrganizationAdmin } from "@/actions/admin.actions"

export function DeleteOrgDialog({
  orgId,
  orgName,
}: {
  orgId: string
  orgName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const confirmSchema = z.object({
    confirm: z.literal(orgName, { error: `Type "${orgName}" to confirm.` }),
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ confirm: string }>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { confirm: "" },
  })

  const confirmText = watch("confirm")

  function onSubmit() {
    startTransition(async () => {
      await deleteOrganizationAdmin(orgId)
      router.push("/admin/organizations")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Delete {orgName}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the workspace, its members, and all
              associated data. Type{" "}
              <span className="font-semibold">{orgName}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-org">Workspace name</Label>
            <Input
              id="confirm-org"
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
  )
}
