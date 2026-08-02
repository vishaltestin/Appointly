import Link from "next/link"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { CreateOrgForm } from "@/components/organization/create-org-form"

export default async function NewOrganizationPage() {
  const user = await requireAuth()

  const existingMembership = await db.membership.findFirst({
    where: { userId: user.id! },
    include: { organization: true },
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create a workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up a new organization to manage its own bookings and team.
          </p>
        </div>
        <CreateOrgForm />
        <div className="text-center">
          <Link
            href={
              existingMembership
                ? `/app/${existingMembership.organization.slug}/dashboard`
                : "/app/no-workspace"
            }
            className="text-sm text-muted-foreground hover:underline"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
