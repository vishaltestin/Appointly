import "server-only"
import { db } from "@/lib/db"
import { DEFAULT_WORKING_HOURS } from "@/lib/availability"
import type { Membership, Organization, User } from "@/generated/prisma/client"

/**
 * Guarantees a member has at least one schedule before they can be booked.
 * Called from both the Availability page (Module 4) and Event Type creation
 * (Module 5) so it's impossible to end up with a bookable service that has
 * no working hours behind it.
 */
export async function ensureDefaultScheduleForMembership(
  membership: Membership & { user: User; organization: Organization }
) {
  const count = await db.schedule.count({
    where: { membershipId: membership.id },
  })
  if (count > 0) return

  await db.schedule.create({
    data: {
      membershipId: membership.id,
      name: "Working Hours",
      timezone: membership.user.timezone || membership.organization.timezone,
      isDefault: true,
      workingHours: { create: DEFAULT_WORKING_HOURS },
    },
  })
}
