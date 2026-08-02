"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateBookingQuestions } from "@/actions/event-type.actions"

interface Question {
  id?: string
  label: string
  type: "TEXT" | "TEXTAREA" | "PHONE"
  required: boolean
}

export function BookingQuestionsManager({
  orgSlug,
  eventTypeId,
  initialQuestions,
}: {
  orgSlug: string
  eventTypeId: string
  initialQuestions: Question[]
}) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { label: "", type: "TEXT", required: false },
    ])
  }
  function updateQuestion(index: number, patch: Partial<Question>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    )
  }
  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    setError(null)
    setSuccess(null)
    if (questions.some((q) => !q.label.trim())) {
      setError("All questions need a label.")
      return
    }
    startTransition(async () => {
      const res = await updateBookingQuestions(orgSlug, eventTypeId, {
        questions,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      setSuccess(res?.success ?? "Saved.")
    })
  }

  return (
    <div className="max-w-2xl space-y-4">
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

      <p className="text-sm text-muted-foreground">
        Name and email are always collected automatically. Add extra questions
        to gather more context upfront.
      </p>

      <div className="space-y-3">
        {questions.map((q, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg border p-3"
          >
            <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Question label"
                value={q.label}
                onChange={(e) =>
                  updateQuestion(index, { label: e.target.value })
                }
              />
              <div className="flex items-center gap-3">
                <Select
                  value={q.type}
                  onValueChange={(next: string | null) => {
                    if (next)
                      updateQuestion(index, { type: next as Question["type"] })
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Short text</SelectItem>
                    <SelectItem value="TEXTAREA">Long text</SelectItem>
                    <SelectItem value="PHONE">Phone number</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={q.required}
                    onCheckedChange={(v) =>
                      updateQuestion(index, { required: Boolean(v) })
                    }
                  />
                  <Label className="text-sm">Required</Label>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeQuestion(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={addQuestion}
          disabled={questions.length >= 10}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add question
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save questions
        </Button>
      </div>
    </div>
  )
}
