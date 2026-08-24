# Appointly — User Guide

Appointly is a multi-tenant appointment scheduling app. You set up a
**workspace**, define your **availability**, create **event types** (the
things people can book), share a **booking link**, and manage the bookings
that come in — including approvals, reschedules, cancellations, and a
lightweight customer CRM.

This guide covers everything you can do in the product, from sign-up to
day-to-day scheduling.

---

## 1. Getting started

### Create your account

Open the app and choose **Create an account**. Enter your name, email, and
password (or use **Continue with Google** if it's enabled on your instance).

After registering, Appointly automatically creates your first workspace
("*Your name*'s Workspace") and lands you on its dashboard.

### Sign in

Use **Sign in** with your email and password. If your organization enabled
Google sign-in, you can use that instead with the same email address.

### Your first tour

Once you're in, the left sidebar is your map:

| Section | What it does |
| --- | --- |
| **Dashboard** | Booking volume, upcoming meetings, popular event types, busiest times |
| **Bookings** | Every booking: upcoming, pending, past, cancelled |
| **Event types** | The bookable services people can pick from |
| **Availability** | Your weekly schedules and date-specific overrides |
| **Customers** | Everyone who has booked with you, plus private notes |
| **Settings** | Workspace profile, team members, plan & usage |
| **Booking page** | Opens your public booking page in a new tab |

The top bar has a breadcrumb for where you are, a light/dark theme toggle,
and your account menu (switch workspace, workspace settings, sign out).

---

## 2. Availability

Availability answers: *"When can people book me?"*

### Schedules

A **schedule** is a weekly template of working hours, in a specific time
zone. You always have a **Default** schedule — event types that don't pick
their own schedule use it.

On **Availability** you can:

- **Create a schedule** — start from sensible defaults (Mon–Fri, 9–5) or
  copy an existing schedule.
- **Edit working hours** — toggle days on/off and set time ranges per day.
- **Set the schedule's time zone** — slots for attendees are computed from
  this time zone.
- **Delete** schedules you don't need (a confirmation dialog protects you
  from accidents).

### Date overrides

Inside a schedule you can add **date overrides** for specific calendar
dates:

- **Unavailable** — block a day entirely (vacation, holiday).
- **Custom hours** — work different hours that day only.

### Buffers and the preview

Each schedule has optional **buffer before/after** times (breathing room
around meetings). While editing, the **availability preview** shows exactly
which slots an attendee would see over the coming days — use it to sanity
check before sharing your link.

---

## 3. Event types

An **event type** is something people can book: "Intro Call", "Deep Dive",
a 90-minute consultation — each with its own link.

Create one from **Event types → New event type**. It has three tabs:

### Details

- **Title & booking link** — the slug becomes `/book/<workspace>/<slug>`.
- **Description** — shown to attendees on the booking page.
- **Duration** — quick presets (15–90 min) or any custom length.
- **Location** — in-person, phone call, online meeting (link), or custom.
- **Color** — used to distinguish the event type in your booking list.

### Availability

- **Schedule** — use your default schedule or pin this event type to a
  specific one.
- **Buffers before/after**, **minimum notice**, **maximum bookings per
  day** — override the schedule defaults when this event type needs
  special rules.
- **Require manual confirmation** — when on, new bookings arrive as
  **Pending** and nothing is confirmed until you approve.

### Booking questions

Add custom questions attendees must answer when booking (short text, long
text, or phone number, each optional or required). Answers appear on the
booking's detail page.

### Sharing

From the event type editor, use:

- **Copy link** — copies the public URL to your clipboard.
- **Preview** — opens the public booking page in a new tab.

Your **workspace booking page** (`/book/<your-slug>`) lists all your active
event types, so you can share one link for everything.

### Plan limits

The **Free** plan includes 2 event types; **Pro** includes 20; **Business**
is unlimited. When you hit the cap, the create button is disabled with an
explanation — ask your workspace owner about upgrading.

---

## 4. Bookings

### The bookings list

**Bookings** shows everything, with tabs for **Upcoming**, **Pending**,
**Past**, and **Cancelled**. Click any booking to open its detail page.

- **Owners and admins** see every booking in the workspace in these lists —
  each row is labelled with its host ("hosted by …").
- **Members** see only the bookings they host.

On the detail page you'll find the meeting snapshot (date/time, duration,
time zone, location), the attendee's contact details, the host, and any
answers to your booking questions.

### Approving pending bookings

If an event type requires manual confirmation, bookings arrive under
**Pending**. Open the booking and **Approve** or **Decline** — the attendee
sees the outcome on their manage page.

### Rescheduling a booking

From the booking detail, choose **Reschedule**, pick a new slot, and
confirm. The old time is released and the new one takes its place — it
still counts as one booking in your stats.

### Cancelling a booking

Choose **Cancel booking**, confirm in the dialog, and the slot is released.
Cancellations are tracked per customer.

### Reminder emails

If your administrator schedules the reminder job, attendees automatically
receive a reminder email before their meeting.

---

## 5. Customers

Every booking creates or updates a **customer** record automatically — no
manual entry needed.

- **Customers list** shows each person's total bookings and last booking
  date, with **search** (name or email) and **sorting** (recently booked,
  name, most bookings).
- Open a customer to see their **booking history**, lifetime stats
  (total / completed / cancelled), and **internal notes** — private to your
  workspace, never shown to the customer.

---

## 6. Team & workspaces

### Inviting people

Workspace owners and admins can invite teammates from
**Settings → Members → Invite member**: enter their email and pick a role.
They receive an invitation link (valid for 7 days) and join instantly after
signing in. Seats are limited by plan (Free: 1, Pro: 5, Business: unlimited).

### Roles

| Role | Can do |
| --- | --- |
| **Owner** | Everything an admin can do, plus plan & billing, assigning roles, and deleting the workspace |
| **Admin** | See and manage **everyone's** bookings, invite and remove members, edit workspace settings |
| **Member** | Manage their **own** event types, availability, and bookings — no access to workspace settings |

The same comparison is shown on **Settings → Members** and while picking a
role in the invite dialog. Members don't see the **Settings** section in
the sidebar at all; owners and admins do.

### Multiple workspaces

Use the **workspace switcher** at the top of the sidebar to move between
workspaces you belong to, or **create a new workspace** from the account
menu. Each workspace has its own event types, bookings, customers, and plan.

### Workspace settings

**Settings → General** lets you rename the workspace and change its URL
slug (which changes your booking links) and time zone. The **danger zone**
at the bottom permanently deletes the workspace — this erases all of its
bookings and customers.

---

## 7. Plans & usage

**Settings → Plan** shows your current plan, live usage meters (event
types and seats used vs. included), a plan comparison, and your workspace's
plan change history.

| | Free | Pro | Business |
| --- | --- | --- | --- |
| Price | $0 | $12/mo | $39/mo |
| Event types | 2 | 20 | Unlimited |
| Team seats | 1 | 5 | Unlimited |

Plan changes are applied by the platform team (see the admin panel below)
and recorded in the plan history.

---

## 8. The attendee experience

Everything below is public — no account required.

1. **Booking page** (`/book/<workspace>`) — the attendee picks an event
   type from your list.
2. **Pick a time** — they see a calendar with your real availability in
   *their own* time zone, pick a day, then a slot.
3. **Your details** — they enter name, email, and answer any questions
   you've configured.
4. **Confirmation** — they get a confirmation page with all the details
   and a **manage booking** link.

From the **manage booking** link, attendees can **reschedule** (pick a new
time themselves) or **cancel** — no account needed, and you see the change
instantly in your bookings list.

---

## 9. The admin panel (platform team)

Super admins get an additional **/admin** area, separate from any
workspace:

- **Overview** — platform totals (workspaces, users, bookings).
- **Organizations** — every workspace; open one to see members, change its
  **plan**, **suspend** it (members see a friendly "suspended" page), or
  **delete** it permanently.
- **Users** — every account; suspend a user or promote someone to super
  admin.
- **Plans** — the plan catalog and how many workspaces are on each.

All three lists are data tables: type to **filter**, click a column heading
to **sort**, page through with the footer controls, or **Export CSV** to
download the filtered, sorted rows.

Suspensions are reversible; deletions are not. Plan changes are logged and
visible to the workspace under **Settings → Plan → history**.

---

## 10. Tips & troubleshooting

- **Empty dashboard?** Charts fill in once bookings start arriving — share
  your booking link and create a test booking to see everything working.
- **Slots not showing on your booking page?** Check that your schedule has
  working hours enabled for the right days, and look at date overrides —
  an "Unavailable" override blocks the whole day.
- **Booking page 404?** The workspace slug changed — reopen
  **Settings → General** to see (and share) the current URL.
- **Time looks wrong?** Schedules compute slots in *their* time zone;
  attendees see times converted to *theirs*.
- **Dark mode** — use the sun/moon toggle in the top bar; the whole app,
  including the public booking pages, supports it.
