import "server-only"

interface SendInvitationEmailParams {
  to: string
  orgName: string
  inviteUrl: string
  inviterName: string
}

export async function sendInvitationEmail({
  to,
  orgName,
  inviteUrl,
  inviterName,
}: SendInvitationEmailParams) {
  console.log(`
    ─────────────────────────────────────────
    📧  Invitation Email (stub)
    To:      ${to}
    Subject: ${inviterName} invited you to join ${orgName} on Appointly
    Link:    ${inviteUrl}
    ─────────────────────────────────────────
  `)
}

interface SendBookingConfirmationParams {
  to: string
  eventTitle: string
  hostName: string
  startTime: Date
  confirmationUrl: string
  manageUrl: string
}

export async function sendBookingConfirmationEmail({
  to,
  eventTitle,
  hostName,
  startTime,
  confirmationUrl,
  manageUrl,
}: SendBookingConfirmationParams) {
  console.log(`
    ─────────────────────────────────────────
    📧  Booking Confirmation Email (stub)
    To:      ${to}
    Subject: Confirmed: ${eventTitle} with ${hostName}
    When:    ${startTime.toISOString()}
    Details: ${confirmationUrl}
    Manage:  ${manageUrl}
    ─────────────────────────────────────────
  `)
}

interface SendBookingCancellationEmailParams {
  to: string
  eventTitle: string
  startTime: Date
  cancelledByLabel: string
  reason?: string
}

export async function sendBookingCancellationEmail({
  to,
  eventTitle,
  startTime,
  cancelledByLabel,
  reason,
}: SendBookingCancellationEmailParams) {
  console.log(`
    ─────────────────────────────────────────
    📧  Booking Cancellation Email (stub)
    To:      ${to}
    Subject: Cancelled: ${eventTitle}
    When:    ${startTime.toISOString()}
    By:      ${cancelledByLabel}
    Reason:  ${reason ?? "—"}
    ─────────────────────────────────────────
  `)
}

interface SendBookingPendingApprovalEmailParams {
  to: string
  eventTitle: string
  hostName: string
  startTime: Date
  manageUrl: string
}

/** Sent to the ATTENDEE when their booking requires host approval. */
export async function sendBookingPendingApprovalEmail({
  to,
  eventTitle,
  hostName,
  startTime,
  manageUrl,
}: SendBookingPendingApprovalEmailParams) {
  console.log(`
    ─────────────────────────────────────────
    📧  Booking Pending Approval Email (stub)
    To:      ${to}
    Subject: Your request for ${eventTitle} with ${hostName} is pending approval
    When:    ${startTime.toISOString()}
    Manage:  ${manageUrl}
    ─────────────────────────────────────────
  `)
}

interface SendHostApprovalRequiredEmailParams {
  to: string
  eventTitle: string
  attendeeName: string
  startTime: Date
  reviewUrl: string
}

/** Sent to the HOST when a new booking is awaiting their approval. */
export async function sendHostApprovalRequiredEmail({
  to,
  eventTitle,
  attendeeName,
  startTime,
  reviewUrl,
}: SendHostApprovalRequiredEmailParams) {
  console.log(`
    ─────────────────────────────────────────
    📧  Action Required Email (stub)
    To:      ${to}
    Subject: New booking request: ${eventTitle} with ${attendeeName}
    When:    ${startTime.toISOString()}
    Review:  ${reviewUrl}
    ─────────────────────────────────────────
  `)
}
interface SendBookingDeclinedEmailParams {
  to: string
  eventTitle: string
  hostName: string
  startTime: Date
  reason?: string
}

export async function sendBookingDeclinedEmail({
  to,
  eventTitle,
  hostName,
  startTime,
  reason,
}: SendBookingDeclinedEmailParams) {
  console.log(`
    ─────────────────────────────────────────
    📧  Booking Declined Email (stub)
    To:      ${to}
    Subject: Your request for ${eventTitle} with ${hostName} was declined
    When:    ${startTime.toISOString()}
    Reason:  ${reason ?? "—"}
    ─────────────────────────────────────────
  `)
}

interface SendBookingRescheduledEmailParams {
  to: string
  eventTitle: string
  counterpartName: string
  oldStartTime: Date
  newStartTime: Date
  manageUrl: string
}

export async function sendBookingRescheduledEmail({
  to,
  eventTitle,
  counterpartName,
  oldStartTime,
  newStartTime,
  manageUrl,
}: SendBookingRescheduledEmailParams) {
  console.log(`
─────────────────────────────────────────
📅 Booking Rescheduled Email (stub)
To: ${to}
Subject: Rescheduled: ${eventTitle} with ${counterpartName}
Old time: ${oldStartTime.toISOString()}
New time: ${newStartTime.toISOString()}
Manage: ${manageUrl}
─────────────────────────────────────────
`)
}
interface SendBookingReminderParams {
  to: string
  eventTitle: string
  counterpartName: string
  startTime: Date
  manageUrl: string
}

export async function sendBookingReminderEmail({
  to,
  eventTitle,
  counterpartName,
  startTime,
  manageUrl,
}: SendBookingReminderParams) {
  console.log(`
─────────────────────────────────────────
⏰ Booking Reminder Email (stub)
To: ${to}
Subject: Reminder: ${eventTitle} with ${counterpartName}
When: ${startTime.toISOString()}
Manage: ${manageUrl}
─────────────────────────────────────────
`)
}

interface SendBookingApprovedEmailParams {
  to: string
  eventTitle: string
  hostName: string
  startTime: Date
  manageUrl: string
}

export async function sendBookingApprovedEmail({
  to,
  eventTitle,
  hostName,
  startTime,
  manageUrl,
}: SendBookingApprovedEmailParams) {
  console.log(`
    ─────────────────────────────────────────
    📧  Booking Approved Email (stub)
    To:      ${to}
    Subject: Confirmed: ${eventTitle} with ${hostName}
    When:    ${startTime.toISOString()}
    Manage:  ${manageUrl}
    ─────────────────────────────────────────
  `)
}
