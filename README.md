# Appointly

Multi-tenant SaaS appointment scheduling — event types, public booking pages, availability rules, team workspaces, customer CRM, and manual plan management.

Built with Next.js (App Router), TypeScript, Prisma, MySQL, Auth.js v5, Tailwind, and shadcn/ui.

---

## Getting started

**Requirements:** Node 20+, MySQL 8+ (or MariaDB).

```bash
npm install
cp .env.example .env        # then fill in the values below
npx prisma generate         # emits the client to ./generated/prisma
npx prisma migrate deploy   # or `migrate dev` when iterating on the schema
npm run db:seed             # creates the first SUPER_ADMIN
npm run dev
```

Open http://localhost:3000. Sign in with the seeded admin credentials and
**change the password immediately** — the defaults are public knowledge.

### Environment

Every variable is documented in [`.env.example`](./.env.example). The four
that are always required:

| Variable              | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `DATABASE_URL`        | MySQL connection string                         |
| `AUTH_SECRET`         | Auth.js signing key — `openssl rand -base64 32` |
| `NEXTAUTH_URL`        | Canonical app URL for auth callbacks            |
| `NEXT_PUBLIC_APP_URL` | Used to build booking + manage links in emails  |

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are optional — leave them blank
and the "Continue with Google" button is hidden entirely. `CRON_SECRET` is
required only if you schedule the reminder job.

---

## Scripts

| Command                         | What it does                                  |
| ------------------------------- | --------------------------------------------- |
| `npm run dev`                   | Dev server                                    |
| `npm run build`                 | Production build                              |
| `npm run typecheck`             | `tsc --noEmit`                                |
| `npm run lint`                  | ESLint                                        |
| `npm run format`                | Prettier write                                |
| `npm run knip`                  | Find unused files, exports, and dependencies  |
| `npm run db:seed`               | Create the first super admin                  |
| `npm run verify:plans`          | Assertions for plan-limit math (no DB needed) |
| `npm run fix:customer-counters` | Audit/repair drifted customer aggregates      |

---

## Architecture

```
app/
  (auth)/            Login, register
  admin/             Platform admin — orgs, users, plans
  app/[orgSlug]/     The tenant app (dashboard, bookings, event types,
                     availability, customers, settings)
  book/[orgSlug]/    Public booking pages
  manage/[token]/    Attendee self-service — no login required
actions/             Server Actions (all mutations)
lib/                 Domain logic, Prisma client, Zod schemas
prisma/              Schema + migrations
```

**Conventions**

- Server Components by default; `"use client"` only where there's interactivity.
- All mutations are Server Actions returning `{ error }` or `{ success, ... }`.
- Zod schemas live in `lib/validations/*.schema.ts` and export schema + inferred type.
- Prisma client is generated to `./generated/prisma` — import from `@/generated/prisma/client`, **not** `@prisma/client`.
- Route `params` and `searchParams` are Promises; always `await` them.

**Multi-tenancy.** Every query is scoped by `organizationId` via
`requireOrgMembership(orgSlug)`. Suspended orgs and users are gated at that
boundary and on all public pages.

**Bookings snapshot their context.** `eventTitle`, `durationMinutes`,
`hostName`, `hostEmail` are copied onto the booking at creation, so deleting
an event type or removing a member never destroys booking history.

**Manage tokens are the auth boundary.** Attendees cancel and reschedule
without an account; the crypto-random `manageToken` is what authorizes them,
which is why it isn't a cuid.

**Reschedule = cancel + create**, linked by `rescheduledFromId` so the full
trail is preserved.

**Customer counters are denormalized.** Every transition goes through
`lib/customer-counters.ts` inside the booking's own transaction. If they ever
drift, `npm run fix:customer-counters` reports and repairs.

---

## Plans & billing

Billing is **manual** — there's no payment gateway. Money is collected
offline and a super admin records the plan change at `/admin/plans`, which
writes a `PlanChangeLog` audit row.

|                                   | Free      | Pro       | Business  |
| --------------------------------- | --------- | --------- | --------- |
| Event types                       | 2         | 20        | Unlimited |
| Seats (members + pending invites) | 1         | 5         | Unlimited |
| Booking questions                 | 2         | 10        | Unlimited |
| Bookings & customers              | Unlimited | Unlimited | Unlimited |

Limits are defined in `lib/plans.ts` and enforced in `lib/usage.ts`, called
from the server actions — the UI's disabled buttons are a courtesy, the
action is the boundary. Downgrading never deletes data: an over-limit
workspace keeps everything and simply can't add more until it's back under.

---

## Reminder cron

`GET /api/cron/send-reminders` emails attendees with bookings in the next 24
hours. Protect it with `CRON_SECRET` and call it hourly:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.example.com/api/cron/send-reminders
```

## Email

All senders in `lib/mail.ts` are `console.log` stubs. Swap the bodies for
Resend/SES/SendGrid — the call sites and signatures stay the same.
