"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  updateOrgSchema,
  type UpdateOrgInput,
} from "@/lib/validations/organization.schema"
import { updateOrganization } from "@/actions/organization.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COMMON_TIMEZONES } from "@/lib/timezones"

interface OrgSettingsFormProps {
  orgSlug: string
  defaultValues: UpdateOrgInput
  canEdit: boolean
  /** Public app origin, e.g. "https://appointly.example.com" — no trailing slash. */
  appUrl: string
}

export function OrgSettingsForm({
  orgSlug,
  defaultValues,
  canEdit,
  appUrl,
}: OrgSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateOrgInput>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues,
  })

  function onSubmit(values: UpdateOrgInput) {
    setError(null)
    startTransition(async () => {
      const res = await updateOrganization(orgSlug, values)
      if (res?.error) {
        setError(res.error)
        return
      }
      toast.success(res?.success ?? "Saved.")
      if (res?.slug && res.slug !== orgSlug) {
        router.push(`/app/${res.slug}/settings/general`)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid w-full gap-x-6 gap-y-6 lg:grid-cols-2"
    >
      {error && (
        <Alert variant="destructive" className="lg:col-span-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input id="name" disabled={!canEdit} {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Workspace URL</Label>
        <div className="flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring">
          <span className="max-w-[55%] truncate pl-3 text-sm text-muted-foreground">
            {appUrl}/app/
          </span>
          <Input
            id="slug"
            disabled={!canEdit}
            className="border-0 focus-visible:ring-0"
            {...register("slug")}
          />
        </div>
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select
          disabled={!canEdit}
          value={watch("timezone")}
          onValueChange={(next: string | null) => {
            if (next) setValue("timezone", next, { shouldDirty: true })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {canEdit ? (
        <div className="flex items-end justify-start lg:justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}
    </form>
  )
}
