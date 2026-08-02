"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { requireAuth, requireOrgMembership } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import {
  createOrgSchema,
  updateOrgSchema,
  type CreateOrgInput,
  type UpdateOrgInput,
} from "@/lib/validations/organization.schema"

export async function createOrganization(values: CreateOrgInput) {
  const user = await requireAuth()
  const parsed = createOrgSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid workspace name." }

  const slug = await generateUniqueOrgSlug(parsed.data.name)

  const organization = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: parsed.data.name, slug },
    })
    await tx.membership.create({
      data: { userId: user.id!, organizationId: org.id, role: "OWNER" },
    })
    await tx.user.update({
      where: { id: user.id! },
      data: { lastActiveOrgId: org.id },
    })
    return org
  })

  redirect(`/app/${organization.slug}/dashboard`)
}

export async function updateOrganization(
  orgSlug: string,
  values: UpdateOrgInput
) {
  const membership = await requireOrgMembership(orgSlug)
  if (!permissions.canEditOrganization(membership.role)) {
    return { error: "You don't have permission to update this workspace." }
  }

  const parsed = updateOrgSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid fields." }
  const { name, slug, timezone } = parsed.data

  if (slug !== orgSlug) {
    const existing = await db.organization.findUnique({ where: { slug } })
    if (existing) return { error: "This workspace URL is already taken." }
  }

  await db.organization.update({
    where: { id: membership.organizationId },
    data: { name, slug, timezone },
  })

  revalidatePath(`/app/${slug}/settings/general`)
  return { success: "Workspace updated.", slug }
}

export async function deleteOrganization(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)
  if (!permissions.canDeleteOrganization(membership.role)) {
    return { error: "Only the owner can delete this workspace." }
  }

  await db.organization.delete({ where: { id: membership.organizationId } })
  redirect("/app")
}

async function generateUniqueOrgSlug(name: string) {
  const base = generateSlug(name) || "workspace"
  let slug = base
  let suffix = 1
  while (await db.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`
  }
  return slug
}
