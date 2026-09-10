"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { updateCustomerNotesSchema } from "@/lib/validations/customer.schema"
import { updateCustomerNotes } from "@/actions/customer.actions"

type NotesInput = { notes?: string | undefined }

export function CustomerNotesEditor({
  orgSlug,
  customerId,
  initialNotes,
}: {
  orgSlug: string
  customerId: string
  initialNotes: string | null
}) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<NotesInput>({
    resolver: zodResolver(updateCustomerNotesSchema),
    defaultValues: { notes: initialNotes ?? "" },
  })

  function onSubmit(values: NotesInput) {
    startTransition(async () => {
      const res = await updateCustomerNotes(orgSlug, customerId, {
        notes: values.notes?.trim() ? values.notes : undefined,
      })
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      toast.success(res?.success ?? "Notes saved.")
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        id="notes"
        rows={4}
        aria-label="Internal notes"
        aria-invalid={!!errors.notes}
        {...register("notes")}
      />
      {errors.root?.serverError && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.serverError.message}</AlertDescription>
        </Alert>
      )}
      {errors.notes && (
        <p className="text-sm text-destructive">{errors.notes.message}</p>
      )}
      <Button type="submit" size="sm" disabled={isPending || !isDirty}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save notes
      </Button>
    </form>
  )
}
