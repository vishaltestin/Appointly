import { z } from "zod"

export const inviteMemberSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER"], { message: "Select a valid role" }),
})

export const updateMemberRoleSchema = z.object({
  membershipId: z.string(),
  role: z.enum(["ADMIN", "MEMBER"]),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
