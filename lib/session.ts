import "server-only"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/**
 * Gates the /admin panel. Re-checks role AND status against the database
 * on every call (not just the JWT) since a super admin's own status or
 * role could have changed since they last logged in.
 */
export async function requireSuperAdmin() {
  const sessionUser = await requireAuth()

  const dbUser = await db.user.findUnique({
    where: { id: sessionUser.id! },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      globalRole: true,
      status: true,
    },
  })

  if (!dbUser || dbUser.status === "SUSPENDED") redirect("/login")
  if (dbUser.globalRole !== "SUPER_ADMIN") redirect("/app")

  return dbUser
}

/** Confirms membership in an org, and that neither the user nor the org is suspended. */
export async function requireOrgMembership(orgSlug: string) {
  const user = await requireAuth()
  const membership = await db.membership.findFirst({
    where: { userId: user.id!, organization: { slug: orgSlug } },
    include: { organization: true, user: true },
  })

  if (!membership) redirect("/app")
  if (membership.user.status === "SUSPENDED") redirect("/login")
  if (membership.organization.status === "SUSPENDED") {
    redirect(`/app/suspended?org=${orgSlug}`)
  }

  return membership
}
