"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrgMembership, requireSuperAdmin } from "@/lib/session"
import { permissions } from "@/lib/permissions"
import { getOrganizationUsage } from "@/lib/usage"
import {
  changePlanSchema,
  type ChangePlanInput,
} from "@/lib/validations/billing.schema"

// ── Workspace-facing ────────────────────────────────────────────────────────

/**
 * Usage meters for the Plan & Usage settings page. Readable by any member —
 * knowing you're 2 event types from the cap isn't privileged information,
 * and gating it behind OWNER would make the sidebar link dead for everyone
 * else. Only *changing* the plan is restricted.
 */
export async function getWorkspaceUsage(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)
  const usage = await getOrganizationUsage(membership.organizationId)

  return {
    usage,
    canManageBilling: permissions.canManageBilling(membership.role),
    planChangedAt: membership.organization.planChangedAt,
    planNotes: membership.organization.planNotes,
  }
}

/**
 * Plan history for the workspace's own audit trail. Owners only — the notes
 * field can contain internal admin remarks (invoice refs, comp reasons).
 */
export async function getWorkspacePlanHistory(orgSlug: string) {
  const membership = await requireOrgMembership(orgSlug)
  if (!permissions.canManageBilling(membership.role)) {
    return { error: "You don't have permission to view billing history." }
  }

  const logs = await db.planChangeLog.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return { logs }
}

// ── Admin-facing ────────────────────────────────────────────────────────────

/**
 * Manually moves an org between plans. No payment gateway is involved —
 * money is collected offline and an admin records the change here. Every
 * change writes a PlanChangeLog row so there's a permanent answer to "who
 * put this workspace on Business and why".
 */
export async function changeOrganizationPlan(values: ChangePlanInput) {
  const admin = await requireSuperAdmin()

  const parsed = changePlanSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid plan change." }
  }
  const { organizationId, plan, notes } = parsed.data

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, plan: true },
  })
  if (!organization) return { error: "Workspace not found." }
  if (organization.plan === plan) {
    return { error: `This workspace is already on the ${plan} plan.` }
  }

  const now = new Date()

  // Org update + audit log must land together — a plan change with no
  // record of who made it is worse than no change at all.
  await db.$transaction([
    db.organization.update({
      where: { id: organizationId },
      data: {
        plan,
        planChangedBy: admin.id,
        planChangedAt: now,
        planNotes: notes || null,
      },
    }),
    db.planChangeLog.create({
      data: {
        organizationId,
        fromPlan: organization.plan,
        toPlan: plan,
        changedBy: admin.id,
        notes: notes || null,
      },
    }),
  ])

  revalidatePath("/admin/plans")
  revalidatePath("/admin/organizations")
  revalidatePath(`/admin/organizations/${organizationId}`)

  return {
    success: `${organization.name} moved from ${organization.plan} to ${plan}.`,
  }
}

/** Plan history for the admin panel, with the acting admin's name resolved. */
export async function getPlanChangeLogs(organizationId: string) {
  await requireSuperAdmin()

  const logs = await db.planChangeLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // changedBy is a bare user ID (no FK — admins can be deleted without
  // shredding the audit trail), so resolve names in a second pass.
  const adminIds = [...new Set(logs.map((l) => l.changedBy))]
  const admins = await db.user.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, name: true, email: true },
  })
  const adminMap = new Map(admins.map((a) => [a.id, a]))

  return {
    logs: logs.map((log) => ({
      ...log,
      changedByName:
        adminMap.get(log.changedBy)?.name ??
        adminMap.get(log.changedBy)?.email ??
        "Deleted admin",
    })),
  }
}
