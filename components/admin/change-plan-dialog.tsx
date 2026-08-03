"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { changeOrganizationPlan } from "@/actions/billing.actions"
import { PLANS, PLAN_ORDER } from "@/lib/plans"
import type { SubscriptionPlan } from "@/generated/prisma/client"

export function ChangePlanDialog({
  organizationId,
  orgName,
  currentPlan,
}: {
  organizationId: string
  orgName: string
  currentPlan: SubscriptionPlan
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<SubscriptionPlan>(currentPlan)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isDowngrade = PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(currentPlan)

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await changeOrganizationPlan({
        organizationId,
        plan,
        notes: notes.trim(),
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      setOpen(false)
      setNotes("")
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <CreditCard className="mr-2 h-4 w-4" />
            Change plan
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change plan for {orgName}</DialogTitle>
          <DialogDescription>
            Billing is manual — collect payment offline first, then record the
            change here. This is written to the audit log.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Plan</Label>
          <Select
            value={plan}
            onValueChange={(next: string | null) => {
              if (next) setPlan(next as SubscriptionPlan)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAN_ORDER.map((id) => (
                <SelectItem key={id} value={id}>
                  {PLANS[id].name}
                  {PLANS[id].price > 0 && ` — $${PLANS[id].price}/mo`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isDowngrade && (
          <Alert>
            <AlertDescription>
              Downgrading won&apos;t delete anything. If the workspace is over
              the new limits it simply can&apos;t create more until it&apos;s
              back under them.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="plan-notes">Notes (optional)</Label>
          <Textarea
            id="plan-notes"
            placeholder="e.g. Invoice #1042 paid by bank transfer"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </div>

        <DialogFooter>
          <Button
            disabled={isPending || plan === currentPlan}
            onClick={handleSave}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save plan change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
