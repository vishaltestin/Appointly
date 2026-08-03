import type { SubscriptionPlan } from "@/generated/prisma/client"

/**
 * The plan catalog. Deliberately a plain module (no "server-only") so the
 * plan comparison table and usage meters can import it from client
 * components without a second source of truth.
 *
 * Billing is *manual* for now — an Appointly admin changes an org's plan
 * from the admin panel after payment is collected offline. There is no
 * payment gateway in this module; see `PlanChangeLog` for the audit trail.
 */

/** `null` means unlimited. */
export interface PlanLimits {
  maxEventTypes: number | null
  maxTeamMembers: number | null
  maxBookingQuestions: number | null
}

export interface PlanDefinition {
  id: SubscriptionPlan
  name: string
  /** Monthly price in USD. 0 = free. Display-only — nothing charges this. */
  price: number
  tagline: string
  limits: PlanLimits
  /** Bullet points for the comparison table. */
  features: string[]
}

export const PLANS: Record<SubscriptionPlan, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    tagline: "For individuals getting started.",
    limits: {
      maxEventTypes: 2,
      maxTeamMembers: 1,
      maxBookingQuestions: 2,
    },
    features: [
      "2 event types",
      "Single user workspace",
      "Unlimited bookings",
      "Public booking page",
      "Email notifications",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 12,
    tagline: "For freelancers and small teams.",
    limits: {
      maxEventTypes: 20,
      maxTeamMembers: 5,
      maxBookingQuestions: 10,
    },
    features: [
      "20 event types",
      "Up to 5 team members",
      "Custom booking questions",
      "Booking approvals",
      "Analytics dashboard",
    ],
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    price: 39,
    tagline: "For agencies and growing teams.",
    limits: {
      maxEventTypes: null,
      maxTeamMembers: null,
      maxBookingQuestions: null,
    },
    features: [
      "Unlimited event types",
      "Unlimited team members",
      "Customer CRM",
      "Priority support",
      "Everything in Pro",
    ],
  },
}

/** Cheapest → most expensive. Used for ordering the comparison table. */
export const PLAN_ORDER: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"]

export function getPlan(plan: SubscriptionPlan): PlanDefinition {
  return PLANS[plan]
}

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLANS[plan].limits
}

/**
 * Which plan is the cheapest one that would allow `needed` of `limitKey`?
 * Powers the "Upgrade to Pro to add more" copy in limit errors, so the
 * message never hardcodes a tier name that might change here later.
 */
export function suggestPlanFor(
  limitKey: keyof PlanLimits,
  needed: number
): PlanDefinition | null {
  for (const id of PLAN_ORDER) {
    const limit = PLANS[id].limits[limitKey]
    if (limit === null || limit >= needed) return PLANS[id]
  }
  return null
}

export function isWithinLimit(limit: number | null, current: number): boolean {
  return limit === null || current < limit
}

/** 0–100, clamped. Unlimited plans always read as 0% used. */
export function usagePercent(current: number, limit: number | null): number {
  if (limit === null || limit === 0) return 0
  return Math.min(100, Math.round((current / limit) * 100))
}

export function formatLimit(limit: number | null): string {
  return limit === null ? "Unlimited" : String(limit)
}
