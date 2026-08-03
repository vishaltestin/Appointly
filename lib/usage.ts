import "server-only"
import { db } from "@/lib/db"
import type { SubscriptionPlan } from "@/generated/prisma/client"
import {
  getPlanLimits,
  isWithinLimit,
  suggestPlanFor,
  type PlanLimits,
} from "@/lib/plans"

export interface UsageSnapshot {
  plan: SubscriptionPlan
  limits: PlanLimits
  eventTypes: number
  /** Accepted members. Pending invitations are counted separately below. */
  teamMembers: number
  pendingInvitations: number
  /**
   * Members + pending invites. Invites are counted against the seat limit —
   * otherwise an owner on a 1-seat plan could queue up 20 invites and blow
   * past the limit the moment they're accepted.
   */
  seatsInUse: number
  bookingsThisMonth: number
  customers: number
}

export async function getOrganizationUsage(
  organizationId: string
): Promise<UsageSnapshot> {
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true },
  })

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    eventTypes,
    teamMembers,
    pendingInvitations,
    bookingsThisMonth,
    customers,
  ] = await Promise.all([
    db.eventType.count({ where: { organizationId } }),
    db.membership.count({ where: { organizationId } }),
    db.invitation.count({
      where: {
        organizationId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    }),
    db.booking.count({
      where: { organizationId, createdAt: { gte: monthStart } },
    }),
    db.customer.count({ where: { organizationId } }),
  ])

  return {
    plan: organization.plan,
    limits: getPlanLimits(organization.plan),
    eventTypes,
    teamMembers,
    pendingInvitations,
    seatsInUse: teamMembers + pendingInvitations,
    bookingsThisMonth,
    customers,
  }
}

interface LimitCheckResult {
  allowed: boolean
  error?: string
}

/**
 * Feature gates are enforced here, in the server actions — never only in the
 * UI. The UI disables the button as a courtesy; this is the actual boundary.
 *
 * Note on downgrades: an admin can drop an org below its current usage (e.g.
 * BUSINESS → FREE with 10 event types). We deliberately do NOT delete or
 * deactivate anything in that case — existing resources keep working, the
 * org just can't create *more* until it's back under the limit. Destroying
 * customer data on a billing change would be indefensible.
 */
export async function canCreateEventType(
  organizationId: string
): Promise<LimitCheckResult> {
  const { plan } = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true },
  })
  const limit = getPlanLimits(plan).maxEventTypes
  const current = await db.eventType.count({ where: { organizationId } })

  if (isWithinLimit(limit, current)) return { allowed: true }

  const suggestion = suggestPlanFor("maxEventTypes", current + 1)
  return {
    allowed: false,
    error: suggestion
      ? `Your ${plan.toLowerCase()} plan includes ${limit} event type${limit === 1 ? "" : "s"}. Upgrade to ${suggestion.name} to add more.`
      : `You've reached the event type limit for your plan.`,
  }
}

export async function canAddTeamMember(
  organizationId: string
): Promise<LimitCheckResult> {
  const { plan } = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true },
  })
  const limit = getPlanLimits(plan).maxTeamMembers

  const [members, invites] = await Promise.all([
    db.membership.count({ where: { organizationId } }),
    db.invitation.count({
      where: {
        organizationId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    }),
  ])
  const seatsInUse = members + invites

  if (isWithinLimit(limit, seatsInUse)) return { allowed: true }

  const suggestion = suggestPlanFor("maxTeamMembers", seatsInUse + 1)
  return {
    allowed: false,
    error: suggestion
      ? `Your ${plan.toLowerCase()} plan includes ${limit} seat${limit === 1 ? "" : "s"} (members + pending invites). Upgrade to ${suggestion.name} to invite more.`
      : `You've reached the team member limit for your plan.`,
  }
}

export async function canAddBookingQuestions(
  organizationId: string,
  requestedCount: number
): Promise<LimitCheckResult> {
  const { plan } = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true },
  })
  const limit = getPlanLimits(plan).maxBookingQuestions

  if (limit === null || requestedCount <= limit) return { allowed: true }

  const suggestion = suggestPlanFor("maxBookingQuestions", requestedCount)
  return {
    allowed: false,
    error: suggestion
      ? `Your ${plan.toLowerCase()} plan allows ${limit} booking question${limit === 1 ? "" : "s"} per event type. Upgrade to ${suggestion.name} for more.`
      : `You've reached the booking question limit for your plan.`,
  }
}
