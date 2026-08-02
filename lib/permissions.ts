import type { OrgRole } from "@/generated/prisma/client"

const ROLE_WEIGHT: Record<OrgRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
}

export function hasMinimumRole(role: OrgRole, minimum: OrgRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minimum]
}

export const permissions = {
  canEditOrganization: (role: OrgRole) => hasMinimumRole(role, "ADMIN"),
  canDeleteOrganization: (role: OrgRole) => role === "OWNER",
  canInviteMembers: (role: OrgRole) => hasMinimumRole(role, "ADMIN"),
  canRemoveMember: (role: OrgRole) => hasMinimumRole(role, "ADMIN"),
  canChangeRoles: (role: OrgRole) => role === "OWNER",
  canManageBilling: (role: OrgRole) => role === "OWNER",
  // New: lets ADMIN/OWNER view & manage bookings hosted by any teammate,
  // not just their own. (Scope note: this applies to direct booking-detail
  // access only — the bookings *list* page intentionally still shows each
  // member their own hosted bookings, to avoid scope creep this module.)
  canManageAllBookings: (role: OrgRole) => hasMinimumRole(role, "ADMIN"),
};