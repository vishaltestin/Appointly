# Appointly — Developer Guide

Everything you need to set up, understand, and safely change this codebase.
Read [`CLAUDE.md`](../CLAUDE.md) alongside this — it is the canonical list of
hard-won conventions and pitfalls; this guide is the "how and why" around it.

---

## 1. Stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router), **React 19**, TypeScript strict |
| Database | **Prisma 7** + MySQL 8 (or MariaDB), client generated to `generated/prisma` |
| Auth | **Auth.js v5** (`next-auth@beta`) — credentials + optional Google |
| UI | Tailwind 4 + **shadcn/ui** components built on **@base-ui/react** (not Radix) |
| Forms | react-hook-form + Zod |
| Emails | `lib/mail.ts` — **console stubs**; swap in a real provider to send |
| Testing | `tsx scripts/verify-*.ts` assertion suites (no framework) |

---

## 2. Local setup

**Requirements:** Node 20+, MySQL 8+ or MariaDB running locally.

```bash
npm install
cp .env.example .env        # fill in the values (see §3)
npx prisma generate         # client → ./generated/prisma (gitignored)
npx prisma migrate deploy   # use `migrate dev` when changing the schema
npm run db:seed             # creates the first SUPER_ADMIN
npm run dev                 # http://localhost:3000
```

Sign in with the seeded admin (`admin@appointly.dev` / `ChangeMe123`
unless you overrode it) and **change the password**. Registering a normal
account via `/register` auto-creates that user's first workspace.

## 3. Environment variables

All of them are documented inline in [`.env.example`](../.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | MySQL connection string |
| `AUTH_SECRET` | ✅ | Auth.js session signing key (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | Canonical app URL for auth callbacks |
| `NEXT_PUBLIC_APP_URL` | ✅ | Base URL for booking/manage links (client-safe) |
| `AUTH_TRUST_HOST` | — | Trust forwarded host headers (proxy deployments) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Google OAuth; if unset the button is hidden entirely |
| `CRON_SECRET` | — | Bearer token guarding `POST /api/cron/send-reminders` |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | — | Seed credentials for `npm run db:seed` |

## 4. Database workflow

- **Schema:** `prisma/schema.prisma` → MySQL. Never edit the DB by hand;
  write a migration (`npx prisma migrate dev --name <change>`).
- **Client:** always import from `@/generated/prisma/client` — never
  `@prisma/client`. The generated output is not committed; CI/deploys must
  run `prisma generate`.
- **Customer counters** (`total/completed/cancelledBookings`,
  `first/lastBookingAt`) are **denormalized**. Every transition must go
  through `lib/customer-counters.ts` — the file header documents the exact
  definitions, including why **reschedule deliberately does not touch
  counters**. If drift is ever suspected, `npm run fix:customer-counters`
  audits and repairs from source rows; `npm run verify:counters` proves the
  incremental path matches a from-scratch recompute across 9 scenarios.
- **Booking lifecycle:** statuses are `PENDING → CONFIRMED → CANCELLED`
  (plus `cancelledBy: HOST | ATTENDEE`). Reschedule = cancel-old +
  create-new sharing one `customerId`; the superseded row is excluded from
  counters and from the "Cancelled" tab.

## 5. Architecture

### 5.1 Route tree

```
app/
  page.tsx                  # marketing landing page
  (auth)/                   # login / register (split-panel layout)
  app/                      # signed-in product
    page.tsx                # → redirects to first workspace
    new/                    # create workspace
    no-workspace/           # friendly dead-end with next steps
    suspended/              # org suspension notice
    [orgSlug]/              # workspace shell (sidebar + header)
      dashboard/ bookings/  # analytics + booking management
      event-types/          # editor tabs: details / availability / questions
      availability/         # schedules, weekly hours, date overrides
      customers/            # auto-CRM + notes
      settings/             # general · members · plan (tabbed layout)
  book/[orgSlug]/           # PUBLIC: org profile + booking flow
    [eventSlug]/confirmation/[bookingId]/
  manage/[manageToken]/     # PUBLIC: attendee self-serve (cancel/reschedule)
  invite/[token]/           # invitation acceptance
  admin/                    # super-admin panel (separate shell)
  api/auth/[...nextauth]/   # Auth.js handler
  api/cron/send-reminders/  # reminder job (Bearer CRON_SECRET)
```

### 5.2 Auth — the edge/Node split

Auth.js v5 runs in two runtimes, so configuration is split in two:

- **`auth.config.ts`** — edge-safe: providers list, callbacks, pages. Used
  by `proxy.ts` (the middleware file; Next 16 renamed `middleware.ts`
  conventions — this project uses `proxy.ts`) to make redirect decisions
  without Node APIs.
- **`auth.ts`** — Node runtime: Prisma adapter, credential verification
  (bcrypt), session augmentation. Used by Server Actions and route handlers
  via the exported `auth()`.

Route protection lives in `proxy.ts` for coarse gating (signed-in vs not,
admin area, suspended orgs) and in `lib/session.ts` helpers
(`requireAuth`, `requireOrgMembership`, `requireSuperAdmin`) inside each
page/action. **Never check the session ad-hoc — use those helpers.**

### 5.3 Mutations & validation

- All writes are **Server Actions** in `actions/*.actions.ts`, returning
  `{ error: string } | { success: string, ... }`. Routes never write.
- Input is validated with **Zod** schemas in `lib/validations/*.schema.ts`
  at the action boundary — validate again server-side even if the client
  already did.
- Plan limits are enforced in `lib/plans.ts` + `lib/usage.ts`
  (`npm run verify:plans` covers the math — keep it passing).
- There are **no barrel exports**; import from concrete paths.

### 5.4 Booking engine

`lib/booking-engine.ts` computes slots: it takes the event type's schedule
(**falling back to the host's default schedule when `scheduleId` is null**),
applies working hours, date overrides, buffers, minimum notice, daily caps,
and existing bookings, then converts host-zone slots into the attendee's
time zone. Anything touching availability math must go through it — never
re-implement per-page.

### 5.5 Emails & the cron

`lib/mail.ts` is a **stub that console.logs**. The API is shaped like a
real sender; to go live, wire it to Resend/SES/etc. without touching
callers. `app/api/cron/send-reminders/route.ts` is triggered by any
scheduler that can POST with `Authorization: Bearer $CRON_SECRET`.

### 5.6 UI system

- Components come from the **shadcn CLI** (`npx shadcn@latest add …`) built
  on **@base-ui/react** primitives — there is **no Radix**. base-ui uses
  `render` props where Radix used `asChild`, and `nativeButton={false}` is
  required when a `Button` renders a non-button element — use
  `components/shared/link-button.tsx` (`LinkButton`) for button-styled
  links; never nest `<Link>` inside `<Button>`.
- base-ui `Select.Value` renders the **raw value** unless given a children
  render function — always map enums/ids to labels
  (`(v) => LABELS[v] ?? v`), as in `event-type-details-form.tsx`.
- Theme tokens live in `app/globals.css` (oklch, light + dark). Charts read
  `var(--token)` directly (**never** `hsl(var(--token))`) via
  `lib/chart-theme.ts`. Any hardcoded palette utility needs a `dark:` pair.
- Toast notifications use **sonner** (`toast.success/error`) — the
  `<Toaster>` is mounted in the root layout. Keep inline `Alert`s for
  errors that need context; use toasts for success feedback.
- Shared pieces: `EmptyState`, `LinkButton`, `Brand`, `HeaderBreadcrumb`,
  `PublicFrame` (public booking pages chrome), `StatusBadge`/`RoleBadge`/
  `PlanBadge` — reuse these instead of hand-rolling new ones.

## 6. Scripts & verification

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js lifecycle |
| `npm run typecheck` | `tsc --noEmit` — must stay 0 errors |
| `npm run lint` | ESLint — 0 errors; 5 known RHF `watch()` warnings |
| `npm run format` | Prettier write |
| `npm run knip` | Unused files/exports/deps — keep clean |
| `npm run db:seed` | Create the first super admin |
| `npm run db:seed:demo` | Reset + load full demo dataset (idempotent — see below) |
| `npm run verify:plans` | 20 assertions on plan-limit math (no DB needed) |
| `npm run verify:counters` | 9 lifecycle scenarios, incremental vs recompute |
| `npm run fix:customer-counters` | Audit/repair drifted customer aggregates |

Before merging anything: `typecheck`, `lint`, `knip`, both verifiers, and
a clean `build`. `typescript.ignoreBuildErrors` must stay off — green means
real.


### Demo dataset

`npm run db:seed:demo` wipes every row except SUPER_ADMIN users and seeds a
complete, schema-consistent demo set:

- **Acme Studio** (PRO) with three members — `amara@example.com` (OWNER),
  `dev@example.com` (ADMIN), `riya@example.com` (MEMBER) — all with password
  `Demo12345`. Five event types, weekly schedules with date overrides, and
  ~35 bookings spanning past and upcoming weeks (confirmed, pending-approval,
  cancelled) linked to ~28 auto-built customer records whose aggregate
  counters are recomputed with the exact production definitions
  (`npm run fix:customer-counters` must report zero drift after a reseed).
- **12 solo organizations** (`owner-<slug>@example.com`, same password) with
  mixed plans, staggered creation dates, one suspended workspace, and a few
  plan-change audit rows — so the super-admin tables are populated.

The script is idempotent: re-running resets to this exact state.

## 7. Deployment

1. Provision MySQL 8 (or MariaDB) and set all env vars from §3.
2. Build with `npx prisma generate && npm run build` (install step must run
   `prisma generate` since `generated/` is gitignored).
3. Apply migrations: `npx prisma migrate deploy`.
4. Seed the first admin once: `npm run db:seed` (set
   `SUPER_ADMIN_EMAIL/PASSWORD` first).
5. Run with `npm run start` behind your platform of choice; set
   `AUTH_TRUST_HOST=true` when behind a proxy.
6. Optionally schedule the reminder cron:
   `curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
     https://<host>/api/cron/send-reminders` every 5–15 minutes.

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `PrismaClientInitializationError: …@prisma/client did not initialize` | Run `npx prisma generate` |
| Unknown env/schema drift after pull | `npx prisma migrate deploy` |
| Booking links point at the wrong host | Set `NEXT_PUBLIC_APP_URL` (and `NEXTAUTH_URL`) to the real origin |
| Google button missing | Expected when Google env vars are unset |
| "Trust host" errors behind a proxy | `AUTH_TRUST_HOST=true` |
| Session instantly invalid after deploy | `AUTH_SECRET` changed or unset — it must be stable across instances |
| Counters look wrong | `npm run verify:counters`, then `npm run fix:customer-counters` if drifted |
| 401 from the cron endpoint | Missing/mismatched `CRON_SECRET` Bearer header |
| Locked out of admin | Re-run `npm run db:seed` with new `SUPER_ADMIN_*` values |
