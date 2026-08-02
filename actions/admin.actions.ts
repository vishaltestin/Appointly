"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/session"
import {
  updateGlobalRoleSchema,
  type UpdateGlobalRoleInput,
} from "@/lib/validations/admin.schema"

export async function suspendOrganization(orgId: string) {
  await requireSuperAdmin()
  await db.organization.update({
    where: { id: orgId },
    data: { status: "SUSPENDED" },
  })
  revalidatePath("/admin/organizations")
  revalidatePath(`/admin/organizations/${orgId}`)
  return { success: "Workspace suspended." }
}

export async function reactivateOrganization(orgId: string) {
  await requireSuperAdmin()
  await db.organization.update({
    where: { id: orgId },
    data: { status: "ACTIVE" },
  })
  revalidatePath("/admin/organizations")
  revalidatePath(`/admin/organizations/${orgId}`)
  return { success: "Workspace reactivated." }
}

export async function deleteOrganizationAdmin(orgId: string) {
  await requireSuperAdmin()
  await db.organization.delete({ where: { id: orgId } })
  revalidatePath("/admin/organizations")
  return { success: "Workspace deleted." }
}

export async function suspendUser(userId: string) {
  const admin = await requireSuperAdmin()
  if (admin.id === userId)
    return { error: "You can't suspend your own account." }

  await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } })
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  return { success: "User suspended." }
}

export async function reactivateUser(userId: string) {
  await requireSuperAdmin()
  await db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } })
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  return { success: "User reactivated." }
}

export async function updateUserGlobalRole(values: UpdateGlobalRoleInput) {
  const admin = await requireSuperAdmin()
  const parsed = updateGlobalRoleSchema.safeParse(values)
  if (!parsed.success) return { error: "Invalid role." }
  if (admin.id === parsed.data.userId)
    return { error: "You can't change your own role." }

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { globalRole: parsed.data.globalRole },
  })

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${parsed.data.userId}`)
  return {
    success:
      "Role updated. The user must sign in again for this to fully take effect.",
  }
}
