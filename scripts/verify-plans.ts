/**
 * Sanity checks for the pure plan-limit math (no DB required).
 * Run: npx tsx scripts/verify-plans.ts
 */
import {
  PLANS,
  PLAN_ORDER,
  getPlanLimits,
  isWithinLimit,
  suggestPlanFor,
  usagePercent,
  formatLimit,
} from "../lib/plans"

let pass = 0
let fail = 0

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

console.log("\nPlan catalog")
check("three plans, cheap → expensive", PLAN_ORDER, ["FREE", "PRO", "BUSINESS"])
check("prices ascend", PLAN_ORDER.map((p) => PLANS[p].price), [0, 12, 39])
check("BUSINESS is unlimited", getPlanLimits("BUSINESS"), {
  maxEventTypes: null,
  maxTeamMembers: null,
  maxBookingQuestions: null,
})

console.log("\nisWithinLimit (current count vs cap)")
check("FREE: 1 of 2 event types → allowed", isWithinLimit(2, 1), true)
check("FREE: 2 of 2 event types → blocked", isWithinLimit(2, 2), false)
check("FREE: over cap after downgrade → blocked", isWithinLimit(2, 9), false)
check("unlimited always allowed", isWithinLimit(null, 10_000), true)

console.log("\nsuggestPlanFor (cheapest plan that fits)")
check("need 3 event types → PRO", suggestPlanFor("maxEventTypes", 3)?.id, "PRO")
check("need 2 event types → FREE", suggestPlanFor("maxEventTypes", 2)?.id, "FREE")
check("need 21 event types → BUSINESS", suggestPlanFor("maxEventTypes", 21)?.id, "BUSINESS")
check("need 2 seats → PRO", suggestPlanFor("maxTeamMembers", 2)?.id, "PRO")
check("need 6 seats → BUSINESS", suggestPlanFor("maxTeamMembers", 6)?.id, "BUSINESS")
check("need 500 seats → BUSINESS (unlimited)", suggestPlanFor("maxTeamMembers", 500)?.id, "BUSINESS")

console.log("\nusagePercent (meter fill)")
check("1/2 = 50%", usagePercent(1, 2), 50)
check("2/2 = 100%", usagePercent(2, 2), 100)
check("clamped over 100", usagePercent(9, 2), 100)
check("unlimited reads 0%", usagePercent(9, null), 0)
check("no divide-by-zero", usagePercent(5, 0), 0)

console.log("\nformatLimit")
check("null → Unlimited", formatLimit(null), "Unlimited")
check("20 → '20'", formatLimit(20), "20")

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
