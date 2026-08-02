import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export default async function AppRootPage() {
  const sessionUser = await requireAuth()
  const user = await db.user.findUnique({ where: { id: sessionUser.id! } })
  if (!user) redirect("/login")

  if (user.lastActiveOrgId) {
    const preferred = await db.membership.findFirst({
      where: { userId: user.id, organizationId: user.lastActiveOrgId },
      include: { organization: true },
    })
    if (preferred) redirect(`/app/${preferred.organization.slug}/dashboard`)
  }

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { organization: true },
  })

  // Previously fell through to /app/new here — that silently nudged
  // removed/orphaned users into creating a brand-new workspace instead of
  // explaining what happened. See /app/no-workspace.
  if (!membership) redirect("/app/no-workspace")

  redirect(`/app/${membership.organization.slug}/dashboard`)
}
