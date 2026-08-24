import type { OrgRole } from "@/generated/prisma/client"

const ROLE_WEIGHT: Record<OrgRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
}

function hasMinimumRole(role: OrgRole, minimum: OrgRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minimum]
}

export const permissions = {
  canEditOrganization: (role: OrgRole) => hasMinimumRole(role, "ADMIN"),
  canDeleteOrganization: (role: OrgRole) => role === "OWNER",
  canInviteMembers: (role: OrgRole) => hasMinimumRole(role, "ADMIN"),
  canRemoveMember: (role: OrgRole) => hasMinimumRole(role, "ADMIN"),
  canChangeRoles: (role: OrgRole) => role === "OWNER",
  canManageBilling: (role: OrgRole) => role === "OWNER",
  // Lets ADMIN/OWNER view & manage bookings hosted by any teammate, not
  // just their own. Applies end-to-end: the bookings list (org-wide scope),
  // booking-detail access, and lifecycle actions all honour it.
  canManageAllBookings: (role: OrgRole) => hasMinimumRole(role, "ADMIN"),
};