"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateCustomerNotes } from "@/actions/customer.actions"

export function CustomerNotesEditor({
  orgSlug,
  customerId,
  initialNotes,
}: {
  orgSlug: string
  customerId: string
  initialNotes: string | null
}) {
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasChanges = notes !== (initialNotes ?? "")

  function handleSave() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await updateCustomerNotes(orgSlug, customerId, {
        notes: notes || undefined,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      setSuccess(res?.success ?? "Saved.")
    })
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        rows={4}
        placeholder="Internal notes about this customer (not visible to them)…"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value)
          setSuccess(null)
        }}
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <Button
        size="sm"
        disabled={isPending || !hasChanges}
        onClick={handleSave}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save notes
      </Button>
    </div>
  )
}
