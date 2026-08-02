"use client"

import { useState, useTransition } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
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
  const [role, setRole] = useState<GlobalRole>(currentRole)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await updateUserGlobalRole({ userId, globalRole: role })
      if (res?.error) {
        setError(res.error)
        return
      }
      setSuccess(res?.success ?? "Role updated.")
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
        <DialogHeader>
          <DialogTitle>Change platform role for {userName}</DialogTitle>
          <DialogDescription>
            Super admins can access the platform admin panel across all
            workspaces.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <Select
          value={role}
          onValueChange={(next: string | null) => {
            if (next) setRole(next as GlobalRole)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button
            disabled={isPending || role === currentRole}
            onClick={handleSave}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
