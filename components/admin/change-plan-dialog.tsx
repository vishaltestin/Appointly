"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { changePlanSchema } from "@/lib/validations/billing.schema"
import { changeOrganizationPlan } from "@/actions/billing.actions"
import { PLANS, PLAN_ORDER } from "@/lib/plans"
import type { SubscriptionPlan } from "@/generated/prisma/client"

type FormInput = { plan: SubscriptionPlan; notes?: string | undefined }

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
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(changePlanSchema.omit({ organizationId: true })),
    defaultValues: { plan: currentPlan, notes: "" },
  })

  const plan = watch("plan")
  const isDowngrade = PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(currentPlan)

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      const res = await changeOrganizationPlan({
        organizationId,
        plan: values.plan,
        notes: values.notes?.trim() ?? "",
      })
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      setOpen(false)
      reset({ plan: values.plan, notes: "" })
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Change plan for {orgName}</DialogTitle>
            <DialogDescription>
              Billing is manual — collect payment offline first, then record
              the change here. This is written to the audit log.
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
            <Label>Plan</Label>
            <Select
              value={plan}
              onValueChange={(next: string | null) => {
                if (next)
                  setValue("plan", next as SubscriptionPlan, {
                    shouldDirty: true,
                  })
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {(v) => PLANS[v as keyof typeof PLANS]?.name ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PLAN_ORDER.map((id) => (
                  <SelectItem key={id} value={id}>
                    {PLANS[id].name}
                    {PLANS[id].price > 0 && ` — ₹${PLANS[id].price}/mo`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isDowngrade && (
            <Alert>
              <AlertDescription>
                Downgrading won&apos;t delete anything. If the workspace is
                over the new limits it simply can&apos;t create more until
                it&apos;s back under them.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="plan-notes">Notes (optional)</Label>
            <Textarea
              id="plan-notes"
              maxLength={500}
              aria-invalid={!!errors.notes}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">
                {errors.notes.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || plan === currentPlan}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save plan change
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
