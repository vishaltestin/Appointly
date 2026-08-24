"use client"

import { useTransition } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateBookingQuestionsSchema } from "@/lib/validations/event-type.schema"
import { updateBookingQuestions } from "@/actions/event-type.actions"
import type { z } from "zod"

interface Question {
  id?: string
  label: string
  type: "TEXT" | "TEXTAREA" | "PHONE"
  required: boolean
}

const QUESTION_TYPE_LABELS: Record<Question["type"], string> = {
  TEXT: "Short text",
  TEXTAREA: "Long text",
  PHONE: "Phone number",
}

type FormInput = z.infer<typeof updateBookingQuestionsSchema>

export function BookingQuestionsManager({
  orgSlug,
  eventTypeId,
  initialQuestions,
}: {
  orgSlug: string
  eventTypeId: string
  initialQuestions: Question[]
}) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(updateBookingQuestionsSchema),
    defaultValues: { questions: initialQuestions },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  const questions = watch("questions")

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      const res = await updateBookingQuestions(orgSlug, eventTypeId, {
        questions: values.questions,
      })
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      toast.success(res?.success ?? "Saved.")
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-4"
    >
      {errors.root?.serverError && (
        <Alert variant="destructive">
          <AlertDescription>
            {errors.root.serverError.message}
          </AlertDescription>
        </Alert>
      )}
      {errors.questions?.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.questions.root.message}</AlertDescription>
        </Alert>
      )}
      {typeof errors.questions?.message === "string" && (
        <Alert variant="destructive">
          <AlertDescription>{errors.questions.message}</AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground">
        Name and email are always collected automatically. Add extra questions
        to gather more context upfront.
      </p>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-2 rounded-lg border p-3"
          >
            <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Question label"
                aria-invalid={!!errors.questions?.[index]?.label}
                {...register(`questions.${index}.label`)}
              />
              {errors.questions?.[index]?.label && (
                <p className="text-sm text-destructive">
                  {errors.questions[index]?.label?.message}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Select
                  value={questions[index]?.type ?? "TEXT"}
                  onValueChange={(next: string | null) => {
                    if (next)
                      setValue(
                        `questions.${index}.type`,
                        next as Question["type"],
                        { shouldDirty: true }
                      )
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>
                      {(v) => QUESTION_TYPE_LABELS[v as Question["type"]] ?? v}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Short text</SelectItem>
                    <SelectItem value="TEXTAREA">Long text</SelectItem>
                    <SelectItem value="PHONE">Phone number</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={questions[index]?.required ?? false}
                    onCheckedChange={(v) =>
                      setValue(`questions.${index}.required`, Boolean(v), {
                        shouldDirty: true,
                      })
                    }
                  />
                  <Label className="text-sm">Required</Label>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label="Remove question"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ label: "", type: "TEXT" as const, required: false })
          }
          disabled={fields.length >= 10}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add question
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save questions
        </Button>
      </div>
    </form>
  )
}
