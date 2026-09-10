"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarPlus, Loader2, MoveRight, Plus } from "lucide-react"
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
import {
  createEventTypeSchema,
  type CreateEventTypeInput,
} from "@/lib/validations/event-type.schema"
import { createEventType } from "@/actions/event-type.actions"

export function CreateEventTypeDialog({
  orgSlug,
  disabled = false,
}: {
  orgSlug: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateEventTypeInput>({
    resolver: zodResolver(createEventTypeSchema),
    defaultValues: { title: "" },
  })

  function onSubmit(values: CreateEventTypeInput) {
    startTransition(async () => {
      const res = await createEventType(orgSlug, { title: values.title.trim() })
      if (res?.error) {
        setError("root.serverError", { message: res.error })
        return
      }
      setOpen(false)
      reset()
      if (res?.eventTypeId)
        router.push(`/app/${orgSlug}/event-types/${res.eventTypeId}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button disabled={disabled}>
            <Plus className="mr-2 h-4 w-4" />
            New event type
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <DialogHeader>
            <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarPlus className="h-5 w-5" />
            </span>
            <DialogTitle>Create an event type</DialogTitle>
            <DialogDescription>
              Name it now — duration, availability, and booking questions come
              next. It becomes a bookable link you can share with clients.
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
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to setup
              <MoveRight className="ml-1.5 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
