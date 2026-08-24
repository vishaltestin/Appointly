"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserGlobalRole } from "@/actions/admin.actions"
import type { GlobalRole } from "@/generated/prisma/client"

const roleSchema = z.object({
  globalRole: z.enum(["USER", "SUPER_ADMIN"]),
})

export function ChangeRoleDialog({
  userId,
  userName,
  currentRole,
}: {
  userId: string
  userName: string
  currentRole: GlobalRole
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{ globalRole: GlobalRole }>({
    resolver: zodResolver(roleSchema),
    defaultValues: { globalRole: currentRole },
  })
  const role = watch("globalRole")

  function onSubmit(values: { globalRole: GlobalRole }) {
    startTransition(async () => {
      const res = await updateUserGlobalRole({
        userId,
        globalRole: values.globalRole,
      })
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      setOpen(false)
      toast.success(res?.success ?? "Role updated.")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Change role
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Change platform role for {userName}</DialogTitle>
            <DialogDescription>
              Super admins can access the platform admin panel across all
              workspaces.
            </DialogDescription>
          </DialogHeader>

          {errors.root?.serverError && (
            <p className="text-sm text-destructive">
              {errors.root.serverError.message}
            </p>
          )}

          <Select
            value={role}
            onValueChange={(next: string | null) => {
              if (next)
                setValue("globalRole", next as GlobalRole, {
                  shouldDirty: true,
                })
            }}
          >
            <SelectTrigger>
              <SelectValue>
                {(v) => (v === "SUPER_ADMIN" ? "Super admin" : "User")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button type="submit" disabled={isPending || role === currentRole}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
