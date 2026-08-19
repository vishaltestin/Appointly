# Appointly User Guide

Welcome to Appointly — the appointment scheduling platform for teams and freelancers. This guide covers everything you need to know to get started and make the most of Appointly.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Your Dashboard](#your-dashboard)
3. [Event Types](#event-types)
4. [Availability](#availability)
5. [Bookings](#bookings)
6. [Customers](#customers)
7. [Settings](#settings)
8. [Booking Pages](#booking-pages)
9. [Team Collaboration](#team-collaboration)
10. [Plans & Billing](#plans--billing)

---

## Getting Started

### Creating Your Account

1. Visit [your-app-url]/register
2. Enter your name, email, and password
3. Optionally sign in with Google
4. Your personal workspace is created automatically

### Your First Workspace

When you sign up, Appointly creates a workspace for you. A workspace is where you manage event types, bookings, and team members. You can create additional workspaces at any time.

---

## Your Dashboard

The dashboard gives you an overview of your scheduling activity:

- **Stats Cards**: Upcoming bookings, completed bookings, cancelled this month, and total hours booked
- **Booking Volume Chart**: Visual chart showing booking trends over the last 30 days
- **Popular Event Types**: Ranked list of your most booked services
- **Busiest Times**: Heatmap showing your busiest days and hours
- **Upcoming Bookings**: Quick view of your next scheduled meetings

---

## Event Types

Event types are the bookable services you offer. Each event type gets its own booking page link.

### Creating an Event Type

1. Go to **Event types** in the sidebar
2. Click **Create event type**
3. Set a title, slug (URL), description, and duration
4. Choose a location type (online, phone, in-person, or custom)
5. Configure availability settings
6. Optionally add custom booking questions

### Managing Event Types

- **Toggle active/hidden**: Use the switch to show or hide an event type
- **Copy booking link**: Click the copy icon to share your booking URL
- **Edit**: Click the event type name to open the editor
- **Delete**: Use the dropdown menu (past bookings are preserved)

### Booking Questions

Collect information from clients before the meeting:
- **Text**: Short text input
- **Textarea**: Longer text responses
- **Phone**: Phone number input

Mark questions as required to ensure clients provide essential information.

---

## Availability

Availability defines when you can be booked. You can create multiple schedules for different use cases.

### Schedules

- **Default schedule**: Used by event types that don't specify a schedule
- **Custom schedules**: Assign specific schedules to different event types

### Setting Weekly Hours

1. Go to **Availability** in the sidebar
2. Click on a schedule to edit it
3. Set your working hours for each day
4. Toggle days on/off as needed

### Date Overrides

Override your regular schedule for specific dates:
- Mark a day as unavailable (holidays, time off)
- Set custom hours for a specific day (extended hours, early finish)

### Buffer Times

Set buffer time before and after meetings:
- **Buffer before**: Time to prepare before a meeting
- **Buffer after**: Time to decompress after a meeting

---

## Bookings

The bookings page shows all meetings scheduled through your event types.

### Booking Tabs

- **Upcoming**: Confirmed future bookings
- **Pending**: Bookings awaiting your approval (if enabled)
- **Past**: Completed meetings
- **Cancelled**: Cancelled bookings

### Booking Details

Click any booking to see:
- Meeting time and duration
- Attendee information and notes
- Custom question responses
- Reschedule/cancel options (for upcoming bookings)

### Pending Bookings

If an event type has "Requires confirmation" enabled, new bookings appear in the Pending tab. You can approve or decline each booking.

### Rescheduling

Rescheduling a booking cancels the original and creates a new one, linked together for a complete audit trail.

---

## Customers

The customers page shows everyone who has booked with you.

### Customer Details

Click a customer to see:
- Total, completed, and cancelled booking counts
- Customer since date
- Notes (editable)
- Complete booking history

### Searching Customers

Use the search bar to find customers by name or email. Results are paginated for easy browsing.

---

## Settings

### General Settings

- **Organization name**: Displayed on booking pages
- **URL slug**: Your unique booking page URL
- **Timezone**: Default timezone for your organization

### Members

Invite team members to your workspace:
- **Owner**: Full access, can manage billing
- **Admin**: Can manage settings and invite members
- **Member**: Can manage their own bookings and event types

### Plan & Usage

View your current plan, usage meters, and plan comparison. Contact billing@appointly.dev to change your plan.

---

## Booking Pages

Each organization has a public booking page at `/book/[your-slug]`. This page lists all active event types and lets clients book directly.

### Sharing Your Booking Page

1. Copy your booking page URL
2. Share via email, social media, or embed on your website
3. Clients select an event type, pick a time, and fill in their details

### Booking Confirmation

After booking, clients receive:
- Confirmation page with meeting details
- Add-to-calendar button (ICS file)
- Manage booking link (to reschedule or cancel)

---

## Team Collaboration

### Inviting Members

1. Go to **Settings → Members**
2. Click **Invite member**
3. Enter their email and select a role
4. They'll receive an invitation link

### Role Permissions

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Manage billing | ✓ | ✗ | ✗ |
| Edit organization | ✓ | ✓ | ✗ |
| Invite members | ✓ | ✓ | ✗ |
| Manage all event types | ✓ | ✓ | ✗ |
| Manage own bookings | ✓ | ✓ | ✓ |
| View all bookings | ✓ | ✓ | ✗ |

---

## Plans & Billing

Appointly offers three plans:

### Free Plan
- 2 event types
- 1 seat (single user)
- 2 booking questions
- Unlimited bookings and customers

### Pro Plan ($12/month)
- 20 event types
- Up to 5 team members
- 10 booking questions
- Booking approvals
- Analytics dashboard

### Business Plan ($39/month)
- Unlimited event types
- Unlimited team members
- Unlimited booking questions
- Customer CRM
- Priority support

Billing is managed manually. Contact billing@appointly.dev to upgrade or change your plan.

---

## Tips & Best Practices

1. **Use descriptive event type names**: "30-min Discovery Call" is better than "Meeting"
2. **Set appropriate buffer times**: Give yourself 5-15 minutes between meetings
3. **Add booking questions**: Collect context before the meeting to prepare
4. **Share your booking page**: Put the link in your email signature and social profiles
5. **Review analytics**: Use the dashboard to identify your busiest times and optimize availability
