# Appointly — Project Context

> This file is the canonical context source for AI-assisted development on Appointly.
> Always read this before writing any code. Update it after completing each module.

---

## Project Overview

Appointly is a multi-tenant SaaS appointment scheduling platform (competing with Cal.com / Calendly). It helps businesses, freelancers, agencies, consultants, coaches, and healthcare professionals manage bookings.

**Brand:** Appointly — premium, professional, clean. UI inspired by Cal.com, Calendly, Notion, Stripe Dashboard, and Linear.

---

## Tech Stack

| Layer         | Technology                                          |
| ------------- | --------------------------------------------------- |
| Framework     | Next.js (App Router)                                |
| Language      | TypeScript (strict)                                 |
| Styling       | Tailwind CSS                                        |
| UI Components | shadcn/ui                                           |
| Forms         | React Hook Form + Zod validation                    |
| Data Fetching | TanStack Query (client), Server Actions (mutations) |
| ORM           | Prisma                                              |
| Database      | MySQL                                               |
| Auth          | Auth.js v5 (next-auth@beta)                         |
| Charts        | Recharts                                            |

---

## Architecture Principles

- **Server-first**: Server Components by default, `"use client"` only when interactivity is needed
- **Server Actions** for all mutations (no API routes for CRUD)
- **Type-safe end-to-end**: Zod schemas → inferred types → Prisma → UI
- **Multi-tenant**: All data scoped to `Organization` via `organizationId`
- **Snapshot pattern**: Bookings snapshot host/event data at creation time — deleting an event type or removing a member never destroys booking history
- **Secure manage links**: Bookings have a `manageToken` (crypto-random hex) for unauthenticated attendee self-service (cancel/reschedule)

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/                    # Login, Register
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   └── ...                    # Redirect to default org
│   ├── admin/                     # Super admin panel
│   ├── app/[orgSlug]/             # Main app (multi-tenant)
│   │   ├── dashboard/page.tsx     # Analytics dashboard (Module 7)
│   │   ├── bookings/              # Booking list + detail
│   │   │   ├── page.tsx
│   │   │   └── [bookingId]/page.tsx
│   │   ├── event-types/           # Event type CRUD + editor
│   │   │   ├── page.tsx
│   │   │   └── [eventTypeId]/page.tsx
│   │   ├── availability/          # Schedule management
│   │   ├── team/                  # Team members + invitations
│   │   ├── customers/             # Customer CRM (Module 7)
│   │   │   ├── page.tsx
│   │   │   └── [customerId]/page.tsx
│   │   └── settings/
│   ├── book/[orgSlug]/            # Public booking pages
│   │   ├── page.tsx               # Org profile (list event types)
│   │   └── [eventSlug]/
│   │       ├── page.tsx           # Booking flow
│   │       └── confirmation/[bookingId]/page.tsx
│   ├── manage/[manageToken]/      # Public manage page (no auth)
│   │   └── page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── cron/send-reminders/route.ts
├── actions/                       # Server Actions
│   ├── auth.actions.ts
│   ├── org.actions.ts
│   ├── team.actions.ts
│   ├── availability.actions.ts
│   ├── event-type.actions.ts
│   ├── booking.actions.ts             # Public booking creation
│   ├── booking-lifecycle.actions.ts   # Cancel, approve, decline, reschedule
│   ├── customer.actions.ts
│   ├── billing.actions.ts         # Plan changes + usage (Module 8)
│   └── dashboard.actions.ts
├── components/
│   ├── auth/
│   ├── layout/                    # Sidebar, header
│   ├── admin/
│   ├── bookings/
│   ├── booking/                   # Public booking flow components
│   ├── availability/
│   ├── event-types/
│   ├── customers/
│   └── dashboard/
├── lib/
│   ├── db.ts                      # Prisma singleton
│   ├── utils.ts                   # cn(), generateSlug(), getInitials()
│   ├── session.ts                 # requireAuth(), requireOrgMembership()
│   ├── auth.ts / auth.config.ts   # Auth.js config (split edge/Node)
│   ├── tokens.ts                  # generateSecureToken() for manage links
│   ├── mail.ts                    # Email stubs (console.log)
│   ├── availability.ts            # Pure slot calculation engine
│   ├── booking-engine.ts          # DB-aware slot calculation
│   ├── schedule-bootstrap.ts      # Ensure default schedule exists
│   ├── customer-counters.ts       # Customer aggregate counters (single source)
│   ├── ics.ts                     # ICS calendar file generation
│   ├── timezones.ts               # COMMON_TIMEZONES list
│   ├── plans.ts                   # Plan catalog + limits (Module 8)
│   ├── usage.ts                   # Usage counts + limit gates (Module 8)
│   ├── chart-theme.ts             # Recharts theme tokens (Module 8)
│   └── validations/               # Zod schemas
│       ├── auth.schema.ts
│       ├── org.schema.ts
│       ├── availability.schema.ts
│       ├── event-type.schema.ts
│       ├── booking.schema.ts
│       ├── booking-management.schema.ts   # cancelBookingSchema
│       ├── customer.schema.ts
│       └── admin.schema.ts
├── auth.ts
├── auth.config.ts
└── middleware.ts                   # Route protection + admin gate

prisma/
└── schema.prisma
```

---

## Database Schema (Current State)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ── Enums ───────────────────────────────────────────────────────────────────

enum GlobalRole { SUPER_ADMIN, USER }
enum OrgRole { OWNER, ADMIN, MEMBER }
enum InvitationStatus { PENDING, ACCEPTED, REVOKED, EXPIRED }
enum UserStatus { ACTIVE, SUSPENDED }
enum OrganizationStatus { ACTIVE, SUSPENDED }
enum LocationType { IN_PERSON, PHONE_CALL, ONLINE_MEETING, CUSTOM }
enum BookingQuestionType { TEXT, TEXTAREA, PHONE }
enum BookingStatus { PENDING, CONFIRMED, CANCELLED }
enum CancelledBy { HOST, ATTENDEE }
enum SubscriptionPlan { FREE, PRO, BUSINESS }
enum DateOverrideType { UNAVAILABLE, CUSTOM_HOURS }

// ── Auth (Auth.js) ──────────────────────────────────────────────────────────

model User {
  id            String       @id @default(cuid())
  name          String?
  email         String       @unique
  emailVerified DateTime?
  image         String?
  password      String?
  globalRole    GlobalRole   @default(USER)
  status        UserStatus   @default(ACTIVE)
  timezone      String       @default("UTC")
  lastActiveOrgId String?
  accounts      Account[]
  sessions      Session[]
  memberships   Membership[]
  invitationsSent Invitation[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ── Multi-tenant ────────────────────────────────────────────────────────────

model Organization {
  id              String               @id @default(cuid())
  name            String
  slug            String               @unique
  logo            String?
  timezone        String               @default("UTC")
  status          OrganizationStatus   @default(ACTIVE)
  plan            SubscriptionPlan     @default(FREE)
  planChangedBy   String?
  planChangedAt   DateTime?
  planNotes       String?              @db.Text
  memberships     Membership[]
  invitations     Invitation[]
  eventTypes      EventType[]
  bookings        Booking[]
  customers       Customer[]
  planChangeLogs  PlanChangeLog[]
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  @@index([plan])
  @@map("organizations")
}

model PlanChangeLog {
  id              String             @id @default(cuid())
  organizationId  String
  fromPlan        SubscriptionPlan
  toPlan          SubscriptionPlan
  changedBy       String
  notes           String?            @db.Text
  createdAt       DateTime           @default(now())
  organization    Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  @@index([organizationId])
  @@map("plan_change_logs")
}

model Membership {
  id             String       @id @default(cuid())
  userId         String
  organizationId String
  role           OrgRole      @default(MEMBER)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  schedules      Schedule[]
  eventTypes     EventType[]
  bookingsAsHost Booking[]
  createdAt      DateTime     @default(now())
  @@unique([userId, organizationId])
  @@map("memberships")
}

model Invitation {
  id             String           @id @default(cuid())
  email          String
  role           OrgRole          @default(MEMBER)
  token          String           @unique
  status         InvitationStatus @default(PENDING)
  organizationId String
  invitedById    String
  expiresAt      DateTime
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invitedBy      User             @relation(fields: [invitedById], references: [id], onDelete: Cascade)
  createdAt      DateTime         @default(now())
  @@unique([email, organizationId, status])
  @@index([organizationId])
  @@map("invitations")
}

// ── Availability ────────────────────────────────────────────────────────────

model Schedule {
  id             String         @id @default(cuid())
  membershipId   String
  name           String
  timezone       String
  isDefault      Boolean        @default(false)
  bufferBefore   Int            @default(0)
  bufferAfter    Int            @default(0)
  membership     Membership     @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  workingHours   WorkingHours[]
  dateOverrides  DateOverride[]
  eventTypes     EventType[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  @@index([membershipId])
  @@map("schedules")
}

model WorkingHours {
  id          String   @id @default(cuid())
  scheduleId  String
  dayOfWeek   Int      // 0=Sun, 6=Sat
  startTime   String   // "09:00"
  endTime     String   // "17:00"
  schedule    Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  @@index([scheduleId])
  @@map("working_hours")
}

model DateOverride {
  id          String           @id @default(cuid())
  scheduleId  String
  date        DateTime         @db.Date
  type        DateOverrideType
  startTime   String?
  endTime     String?
  reason      String?
  schedule    Schedule         @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  @@unique([scheduleId, date])
  @@index([scheduleId])
  @@map("date_overrides")
}

// ── Event Types & Bookings ──────────────────────────────────────────────────

model EventType {
  id                    String           @id @default(cuid())
  membershipId          String
  organizationId        String
  title                 String
  slug                  String
  description           String?          @db.Text
  durationMinutes       Int              @default(30)
  color                 String           @default("#6366f1")
  locationType          LocationType     @default(ONLINE_MEETING)
  locationValue         String?
  scheduleId            String?
  bufferBeforeMinutes   Int?
  bufferAfterMinutes    Int?
  minimumNoticeMinutes  Int              @default(120)
  slotIntervalMinutes   Int?
  maximumBookingsPerDay Int?
  isActive              Boolean          @default(true)
  requiresConfirmation  Boolean          @default(false)
  membership            Membership       @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  organization          Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  schedule              Schedule?        @relation(fields: [scheduleId], references: [id], onDelete: SetNull)
  questions             BookingQuestion[]
  bookings              Booking[]
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  @@unique([organizationId, slug])
  @@index([membershipId])
  @@map("event_types")
}

model BookingQuestion {
  id          String              @id @default(cuid())
  eventTypeId String
  label       String
  type        BookingQuestionType @default(TEXT)
  required    Boolean             @default(false)
  order       Int                 @default(0)
  eventType   EventType           @relation(fields: [eventTypeId], references: [id], onDelete: Cascade)
  @@index([eventTypeId])
  @@map("booking_questions")
}

model Booking {
  id                 String        @id @default(cuid())
  organizationId     String
  eventTypeId        String?
  eventTitle         String
  durationMinutes    Int
  hostMembershipId   String?
  hostName           String
  hostEmail          String
  hostTimezone       String
  attendeeName       String
  attendeeEmail      String
  attendeeTimezone   String
  attendeeNotes      String?       @db.Text
  responses          Json?
  startTime          DateTime
  endTime            DateTime
  status             BookingStatus @default(CONFIRMED)
  manageToken        String        @unique @default(cuid())
  cancelledAt        DateTime?
  cancelledBy        CancelledBy?
  cancellationReason String?       @db.Text
  rescheduledFromId  String?       @unique
  rescheduledFrom    Booking?      @relation("BookingReschedule", fields: [rescheduledFromId], references: [id], onDelete: SetNull)
  rescheduledTo      Booking?      @relation("BookingReschedule")
  reminderSentAt     DateTime?
  customerId         String?
  customer           Customer?     @relation(fields: [customerId], references: [id], onDelete: SetNull)
  organization       Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  eventType          EventType?    @relation(fields: [eventTypeId], references: [id], onDelete: SetNull)
  hostMembership     Membership?   @relation(fields: [hostMembershipId], references: [id], onDelete: SetNull)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  @@index([organizationId, startTime])
  @@index([hostMembershipId, startTime])
  @@index([attendeeEmail])
  @@index([manageToken])
  @@index([customerId])
  @@map("bookings")
}

// ── Customers (Module 7) ────────────────────────────────────────────────────

model Customer {
  id                String       @id @default(cuid())
  organizationId    String
  email             String
  name              String
  timezone          String?
  notes             String?      @db.Text
  totalBookings     Int          @default(0)
  completedBookings Int          @default(0)
  cancelledBookings Int          @default(0)
  firstBookingAt    DateTime?
  lastBookingAt     DateTime?
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  bookings          Booking[]
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([organizationId, name])
  @@map("customers")
}
```

---

## Module Progress

| #   | Module                                                                         | Status      |
| --- | ------------------------------------------------------------------------------ | ----------- |
| 1   | Foundation + Auth (Auth.js v5, JWT, credentials + Google OAuth)                | ✅ Complete |
| 2   | Organization/Workspace + Team Members & Roles (invitations, membership)        | ✅ Complete |
| 3   | Admin dashboard + route gates + middleware.ts                                  | ✅ Complete |
| 4   | Availability engine (working hours, buffers, breaks, holidays, date overrides) | ✅ Complete |
| 5   | Booking pages + public scheduling flow (event types, booking engine, ICS)      | ✅ Complete |
| 6   | Booking lifecycle (cancel, reschedule, approve/decline, reminders, emails)     | ✅ Complete |
| 7   | Customer management + Dashboard analytics                                      | ✅ Complete |
| 8   | Manual billing/plans + feature gates + dark mode polish                        | ✅ Complete |
| 9   | Stripe self-serve checkout                                                     | 🔲 Next     |

---

## Key Design Decisions & Trade-offs

### Auth

- **JWT strategy** (not database sessions) for edge compatibility
- **Split config**: `auth.config.ts` (edge-safe, no bcrypt/Prisma) vs `auth.ts` (full Node runtime)
- **Middleware** handles route protection: `/dashboard`, `/admin`, `/settings` require auth; `/admin` requires `SUPER_ADMIN`

### Multi-tenancy

- **Row-level isolation**: Every query filters by `organizationId` via `requireOrgMembership(orgSlug)`
- **Org suspension**: Suspended orgs get 404 on all public pages (booking, manage)
- **User suspension**: Suspended users can't log in; their event types don't appear on public pages

### Availability

- **Pure function** `getAvailableSlots()` computes slots from working hours, date overrides, buffers, busy periods
- **DB-aware layer** `getEventTypeSlots()` adds booking conflict checking on top
- **PENDING bookings block slots** (not just CONFIRMED) to prevent double-booking unapproved requests

### Bookings

- **Snapshot pattern**: `eventTitle`, `durationMinutes`, `hostName`, `hostEmail`, `hostTimezone` are copied to Booking at creation — deleting event type or removing member preserves history
- **Double-booking protection**: `Serializable` isolation transaction re-checks for conflicts before insert (best-effort, not bulletproof — MySQL lacks range exclusion constraints)
- **Reschedule = cancel old + create new**, linked via `rescheduledFromId` (preserves full audit history)
- **Declining = CANCELLED + cancelledBy: HOST** (no separate DECLINED status — schema simplicity)
- **Manage tokens**: `manageToken` is crypto-random hex (not cuid/uuid) — it's the authorization boundary for public manage pages

### Customers

- **Scoped to Organization** (same person in 2 orgs = 2 customer rows)
- **Upserted on booking create** inside the same transaction
- **Denormalized counters** (`totalBookings`, `completedBookings`, `cancelledBookings`) — updated on create/cancel, avoids COUNT queries on every render

### Billing & Plans (Module 8)

- **Manual billing** — no payment gateway. Money is collected offline; a SUPER_ADMIN records the plan change in `/admin/plans`. Every change writes a `PlanChangeLog` row (org update + log entry in one transaction).
- **Plan catalog lives in `lib/plans.ts`** — a plain module (no `server-only`) so client components can import it for the comparison table. `null` limit = unlimited.
- **Enforcement lives in `lib/usage.ts`** and is called from _server actions_, never only the UI. Disabled buttons are a courtesy; the action is the boundary.
- **Seats = members + pending invitations.** Otherwise a 1-seat workspace could queue 20 invites and blow past the cap when they're accepted.
- **Downgrades never destroy data.** An org over its new limit keeps everything and simply can't create more until it's back under. Deleting customer data on a billing change is indefensible.
- **`changedBy` is a bare user ID with no FK** — deleting an admin must not shred the audit trail. Names are resolved in a second query.
- **Indicative MRR only** — the admin figure reflects recorded plans, not collected payments.

### Emails

- **All stubs** (console.log) — ready to swap with Resend/SendGrid/SES
- Function names: `sendBookingConfirmationEmail`, `sendBookingCancellationEmail`, `sendBookingRescheduledEmail`, `sendBookingPendingApprovalEmail`, `sendHostApprovalRequiredEmail`, `sendBookingApprovedEmail`, `sendBookingDeclinedEmail`, `sendBookingReminderEmail`, `sendInvitationEmail`

---

## Coding Conventions

- **Server Actions** return `{ error: string }` for failures or `{ success: string, ...data }` for success
- **Discriminated unions** for complex returns: `{ error: string } | { success: string; newBookingId: string }`
- **Zod schemas** live in `src/lib/validations/*.schema.ts`, export both schema and inferred type
- **shadcn/ui** Dialog uses `render` prop on `DialogTrigger`: `<DialogTrigger render={<Button>...</Button>} />`
- **Route params** are `Promise<{ ... }>` in Next.js 15 — always `await params`
- **Search params** are also `Promise<{ ... }>` in Next.js 15 — always `await searchParams`
- **TanStack Query** for client-side data fetching with cache invalidation on mutations
- **`revalidatePath`** in server actions after mutations that affect server-rendered pages
- **No barrel exports** — import directly from source files
- **Recharts colors use `var(--token)`, never `hsl(var(--token))`** — `globals.css` defines tokens as complete `oklch(...)` values, so wrapping them in `hsl()` produces invalid CSS. Shared helpers live in `lib/chart-theme.ts`.
- **Every hardcoded palette utility needs a `dark:` pair** (`text-emerald-600 dark:text-emerald-400`)
- **Prisma imports** use `@/generated/prisma/client` (not `@prisma/client`) — the generator outputs to `../generated/prisma`

---

## Environment Variables

```bash
DATABASE_URL="mysql://user:password@localhost:3306/appointly"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
CRON_SECRET="generate-with-openssl-rand-base64-32"
```

---

## Migration History

1. `init_foundation` — User, Account, Session, VerificationToken, Organization, Membership
2. `admin_gates` — User.status, User.globalRole, Organization.status
3. `availability` — Schedule, WorkingHours, DateOverride
4. `event_types_and_bookings` — EventType, BookingQuestion, Booking
5. `booking_lifecycle` — manageToken, cancellation fields, reschedule chain, reminderSentAt, requiresConfirmation
6. `customers` — Customer model, Booking.customerId
7. `manual_billing` — SubscriptionPlan enum, Organization.plan/planChangedBy/planChangedAt/planNotes, PlanChangeLog model (implemented in Module 8; no further migration needed)

> Note: Prisma client is generated to `../generated/prisma`. Import with `from "@/generated/prisma/client"`.

---

## What Module 8 Shipped

### Billing & Subscriptions (manual)

- `lib/plans.ts` — Free / Pro / Business catalog with per-plan limits
- `lib/usage.ts` — `getOrganizationUsage()` + `canCreateEventType()` / `canAddTeamMember()` / `canAddBookingQuestions()`
- Gates wired into `createEventType`, `updateBookingQuestions`, `inviteMember`
- `/app/[orgSlug]/settings/plan` — usage meters, plan comparison, owner-only history
- `/admin/plans` — plan filter tabs, indicative MRR, per-org change dialog
- Plan badges in the sidebar, admin org table, and org detail page
- `UpgradeNotice` shown at the point of friction before the create button errors

### Dark Mode Polish

- Fixed `hsl(var(--token))` → `var(--token)` in both Recharts components (was invalid CSS in _both_ themes, not just dark)
- Added `lib/chart-theme.ts` so chart theming has one source of truth
- Paired every remaining single-tone palette utility with a `dark:` variant
- Added a discoverable `ThemeToggle` (light/dark/system) to both headers — previously dark mode was only reachable via the undocumented `d` hotkey

### Bugs fixed along the way (pre-existing, were breaking `next build`)

- `booking-approval.actions.ts` — `sendBookingDeclinedEmail` missing required `hostName`
- `api/cron/send-reminders` — `sendBookingReminderEmail` missing required `counterpartName`
- `booking-management.actions.ts` — extracted a named `RescheduleResult` union so callers can narrow on `res.error` and reach `newManageToken`

## Cleanup Pass (post-Module 8)

### Booking lifecycle consolidated into one module

Four overlapping modules exported the same function names. They are now a
single canonical `actions/booking-lifecycle.actions.ts`:

| Deleted                                       | Fate                                        |
| --------------------------------------------- | ------------------------------------------- |
| `actions/booking-management.actions.ts`       | merged                                      |
| `actions/booking-approval.actions.ts`         | merged                                      |
| `actions/booking-public-lifecycle.actions.ts` | merged (was orphaned)                       |
| `actions/reschedule.actions.ts`               | merged (was orphaned)                       |
| `lib/customer-upsert.ts`                      | replaced by `lib/customer-counters.ts`      |
| `lib/validations/booking-lifecycle.schema.ts` | duplicate of `booking-management.schema.ts` |

The best implementation won on each axis: `validateReschedulable` and the
original-duration handling came from the orphaned `reschedule.actions.ts`;
the counter adjustment came from the orphaned `booking-public-lifecycle`.

### Customer counter drift — fixed

`Customer.completedBookings` / `cancelledBookings` drifted on every
cancellation because the wired cancel path never adjusted them. All
transitions now live in `lib/customer-counters.ts` and run **inside the
booking's own transaction**.

Counter definitions (mirrored by the repair script):

- `totalBookings` — rows excluding ones superseded by a reschedule
- `completedBookings` — rows currently CONFIRMED
- `cancelledBookings` — CANCELLED rows not superseded by a reschedule

**Reschedule is deliberately a no-op** — the deltas cancel out exactly, so
adjusting counters there would _cause_ drift.

Existing data needs a one-time repair: `npm run fix:customer-counters`
(dry run) then `-- --apply`.

### Other fixes

- **Transaction bug**: `booking.actions.ts` called the customer upsert with the global `db` handle from inside `$transaction`, so the customer row committed even if the booking insert rolled back. Now takes `tx`.
- **`canManageAllBookings` is now wired** — ADMIN/OWNER can manage any booking in their workspace via `requireManageableBooking()`; MEMBER is still host-only. Previously defined but never called.
- **`/dashboard` → `/app`** in `auth.config.ts` (both redirects pointed at a route that doesn't exist).
- **`dotenv` and `server-only` added to `package.json`** — both were imported directly but only present transitively; a clean install could break.
- **`@types/bcryptjs` removed** — bcryptjs v3 ships its own types.
- **`useBrowserTimezone` hook** replaces two `setState`-in-effect patterns that tripped `react-hooks/set-state-in-effect` and caused every slot list to render once in UTC before snapping to the real timezone.
- **`knip.json` added** with `npm run knip`.
- **README rewritten** (was the untouched Next.js template) and `.env.example` added.

### Verification

| Command                   | Result                                                                |
| ------------------------- | --------------------------------------------------------------------- |
| `npm run typecheck`       | 0 errors                                                              |
| `npm run lint`            | 0 errors, 5 warnings (all react-hook-form `watch()` compiler notices) |
| `npm run verify:plans`    | 20/20                                                                 |
| `npm run verify:counters` | 9/9                                                                   |
| `npm run build`           | passes                                                                |

`verify:counters` cross-checks the incremental counter path against a
recompute-from-scratch across 9 lifecycle scenarios — including double
reschedules and reschedule-then-cancel. Both must always agree.

### Known remaining

- `leaveOrganization` and `useOrg` are implemented but have no UI yet.
- 5 React Compiler warnings from `react-hook-form`'s `watch()` — library limitation, not fixable here.
- DB-backed paths are verified by types/build only; no MySQL was available in the dev sandbox.

### Potential Future Enhancements (Post Module 8)

- Stripe integration (self-service checkout, webhooks, customer portal)
- Google Calendar / Outlook sync (two-way)
- Real email delivery (swap stubs with Resend/SES)
- Zoom/Google Meet integration for auto-generated meeting links
- SMS reminders
- Webhooks / API access for Business plan
- White-labeling / custom domains
- Group bookings (multiple attendees)
- Recurring bookings
- Payment collection at booking time
- Analytics export (CSV/PDF reports)
- Mobile app (React Native)

---

## UI/UX Overhaul & Docs Pass

Full product-wide UI pass built on the shadcn CLI component set (base-ui
primitives — still no Radix). Highlights:

- **App shell**: shadcn `Sidebar` (collapsible, icon tooltips, Sheet on
  mobile via `useIsMobile`) for both workspace and admin areas; sticky
  blurred header with `SidebarTrigger` + pathname-derived breadcrumbs.
- **Landing page** (`app/page.tsx`): real marketing page — hero with
  pure-CSS booking mock, features, 3-step workflow, pricing rendered from
  `lib/plans.ts`, footer. Session-aware CTA.
- **Shared pieces**: `LinkButton` (see pitfalls below), `EmptyState`,
  `Brand`, `HeaderBreadcrumb`, `PublicFrame` (public booking chrome).
- **States**: root `error.tsx` + `not-found.tsx`; Skeleton `loading.tsx`
  for workspace / admin / public-booking segments; EmptyStates everywhere a
  list can be bare.
- **Notifications**: sonner toasts on all save/mutation success paths
  (inline `Alert`s kept for contextual errors only).
- **Docs**: `docs/user-guide.md`, `docs/developer-guide.md`, `.env.example`
  (gitignored `.env*` needed a `!.env.example` negation).

### base-ui pitfalls worth writing down

- `Button render={<Link>}` needs `nativeButton={false}` or the console
  fills with a11y warnings — always go through `components/shared/
  link-button.tsx`. Never nest `<Link>` inside `<Button>`.
- `Select.Value` renders the **raw value** unless given a children render
  fn — map enums/ids to labels: `{(v) => LABELS[v] ?? v}`.
- The CLI's `use-mobile.ts` trips `react-hooks/set-state-in-effect`; it
  was rewritten with `useSyncExternalStore` (same semantics, clean lint).

### Bugs fixed in this pass

- Header account menu linked to nonexistent `/account`; login linked to
  nonexistent `/forgot-password`.
- Dashboard volume chart bucketed by `startTime` — future-dated bookings
  were invisible; now buckets by `createdAt`.
- Availability card counted only explicitly-assigned event types —
  event types inherit the default schedule when `scheduleId` is null, so
  the count now includes inherited usage on the default schedule.
- Customer detail "Customer since" showed the first booking's *start time*
  (a future date) — now uses the record's `createdAt`.
- `Link`-inside-`Button` nesting on invite / suspended / no-workspace /
  customer-pagination pages; raw enum values in several Select triggers;
  admin role dialog silently kept stale state (now closes + toasts);
  org settings hardcoded `appointly.com` prefix (uses
  `NEXT_PUBLIC_APP_URL`); DangerZone swallowed delete errors.

### Verification

typecheck 0 errors · lint 0 errors / 5 warnings (known RHF) · knip
baseline-only · verify:plans 20/20 · verify:counters 9/9 · `next build`
passes with an empty `next.config.ts` (no `ignoreBuildErrors`). All major
flows exercised against a real MariaDB instance via the real UI (register
→ workspace → schedule → event types → public booking → approve / cancel
→ customers), on desktop + mobile viewports, light + dark.

## Round 2 — Booking Surfaces Redesign + RHF-Everywhere + Polish

Follow-up pass driven by feedback on the overhaul: every form in the app
now runs on react-hook-form, the public booking flow was rebuilt to a
two-panel Calendly-style layout, and the remaining "template look" pages
were brought up to the same bar.

### react-hook-form everywhere (hard rule from the user)

- Converted the last hand-rolled forms: create event type, cancel booking,
  pending approve/decline, create schedule, add date override, customer
  notes, danger zone, admin delete-org / change-plan / change-role, and
  the booking-questions manager (`useFieldArray`, capped at 10 rows).
- Pattern that repeats: `zodResolver` + server error →
  `setError("root.serverError", { message })` rendered via
  `errors.root?.serverError`, success → `toast.success`, all submit
  buttons `type="submit"` inside `<form onSubmit={handleSubmit(...)} className="space-y-4">`.
- Schemas shared with the server (`lib/validations/*`); UI-only shapes
  extend/omit locally (e.g. `createScheduleSchema.extend({ copyFrom })`,
  `changePlanSchema.omit({ organizationId: true })`, danger-zone
  `z.literal(orgName)` for type-to-confirm).
- zod 4 gotcha: `z.date({ error })` + `.optional()` short-circuits
  before refinements and surfaces a raw "Invalid input" message —
  `z.custom<Date>((v) => v instanceof Date && !isNaN(v.getTime()), "…")`
  renders the friendly copy instead.
- Not forms (deliberately untouched): search inputs, timezone/time
  selects, sort select, theme toggle.

### Bugs fixed in this pass

- **Base UI `MenuGroupContext is missing` crash**: `org-switcher.tsx`
  rendered `DropdownMenuLabel`/`DropdownMenuItem`s outside a
  `DropdownMenuGroup` (base-ui `Menu.GroupLabel` requires
  `<Menu.Group>`/`Menu.RadioGroup`). Wrapped in `DropdownMenuGroup`;
  verified zero console errors across all menus afterwards. Rule:
  `DropdownMenuLabel` only ever inside `DropdownMenuGroup`.
- **Attendee reschedule slots "breaking"**: manage page card was
  `max-w-md`, too narrow for calendar+slots; the old `TimeSlotList` used
  an overlapping grid. Manage card now widens to `max-w-2xl` with a
  `transition-[max-width]` in reschedule mode; `TimeSlotList` rewritten
  as a single column of full-width `role="option"` buttons with skeleton
  loading and proper empty/error states. `RescheduleFlow` lays out as
  `sm:grid-cols-[auto_minmax(0,1fr)]`.
- **Landing "Most popular" badge clipped**: the `Card` primitive is
  `overflow-hidden`; pricing cards now `overflow-visible` with the badge
  absolutely centered at `-top-3`.
- **Confirmation URL cross-tenant leak**: a `bookingId` from one org
  rendered on any other org's confirmation URL; now verifies
  `booking.organization.slug === orgSlug` (and shows the PENDING
  "request sent" state instead of pretending to be confirmed).
- **`/app/[orgSlug]` 404**: org-root now redirects to `/dashboard`
  (trimmed URLs used to 404).
- `danger-zone` trigger referenced nonexistent
  `--destructive-foreground` token (dark text on red); now uses
  `Button variant="destructive"` via the dialog trigger's `render` prop.

### Elevation notes

- Booking/customer/pending rows got a `BookingDateChip`
  (month-over-day calendar block) + status badges with colored dots +
  hover chevrons; customer avatars use `avatarTint(name)` (djb2-xor +
  murmur finalizer → 8 pastel pairs with dark variants; deterministic so
  SSR and client agree).
- Booking flow: `max-w-4xl` two-panel card (left rail with event-color
  tint + icon-tile meta rows + selected-slot recap; right panel
  calendar + slot list + timezone select top-right).
- Public org profile: raised logo tile, 2-col event-type card grid with
  color top bars and hover-arrow chips.
- Settings general form wrapped in a "Workspace profile" card; schedule
  cards got icon tiles; all hardcoded colors verified with `dark:` pairs.

### Verification

typecheck 0 errors · lint 0 errors / 12 warnings (all the known
react-hooks/incompatible-library RHF `watch()` pattern across RHF
Selects) · knip baseline-only · verify:plans 20/20 · verify:counters
9/9 · `next build` passes. Full booking flow driven end-to-end in a real
browser (slot click → details → submit → confirmation redirect;
manage-page reschedule slots; org switcher / user / schedule menus) on
desktop + mobile, light + dark, against both dev and production builds.
Load-bearing page opens all returned 0 console/page errors.

## Round 3 — Premium Type · Reschedule · Data Tables · Roles · ₹

Follow-up feedback pass: typography, breathing room, modern tables,
rupee pricing, and making workspace roles actually mean something.

### What changed (user-visible)

- **Typography**: Inter replaced with **Plus Jakarta Sans**
  (`next/font/google`, same `--font-sans` token — the `@theme inline`
  mapping in `globals.css` is untouched); base layer adds
  `tracking-tight` on h1–h3.
- **Reschedule flows** (attendee manage page dialog and host dialog share
  `RescheduleFlow`): numbered step chips ("1 Choose a day" / "2 …date"),
  calendar cells bumped via `[--cell-size:--spacing(9)]` with `p-3`
  chrome, slot buttons `h-10` (`max-h-80`, `gap-2.5`), empty/error states
  with muted icon circles, and a bordered footer with a live
  "New time: <day> · <slot>" summary next to Cancel / Confirm
  (`h-10 px-6`, `aria-live` on the summary). Host dialog widened to
  `sm:max-w-3xl` with `max-h-[90vh] overflow-y-auto`; manage-card widens
  to `max-w-3xl` in reschedule mode with a proper section heading.
- **Admin tables are real data tables**: new generic client
  `components/shared/data-table.tsx` on `@tanstack/react-table` v8 —
  sortable headers (arrow indicators, `aria-sort` on the `th`), instant
  global filter, `getPaginationRowModel` footer ("Showing 11–15 of 15"),
  and **Export CSV** (filtered+sorted rows, per-column
  `meta.csvValue`/`csvHeader` via module augmentation, RFC-4180 quoting,
  `\uFEFF` BOM so Excel keeps ₹/accents, `actions` columns excluded).
  Columns hidden from the grid (`users` table Email) still export.
  The three admin pages now fetch up to 250 rows and let the client
  organise them; `?q=` deep-links pre-fill the filter via `initialSearch`;
  the plans page keeps its server-side plan filter tabs and the pending
  `total` is surfaced in the subtitle when capped. Deleted
  `admin-search-input.tsx` + `pagination-controls.tsx`.

### Roles & booking visibility (behaviour change)

- `canManageAllBookings` (ADMIN+) now scopes the **bookings list** too,
  not just detail/lifecycle: owners/admins see every booking in the
  workspace with a "hosted by {hostName}" meta line on each row (list +
  pending list); members keep their own hosted bookings. The header copy
  reflects scope ("Every meeting booked across your workspace.").
- **Settings is administration**: `settings/layout.tsx` redirects
  non-`canEditOrganization` members to the dashboard, and the sidebar
  hides Settings + the plan footer for MEMBER (role derived from the
  org-switcher payload — no new props).
- **In-product role explainer**: `RoleLegend` (Owner/Admin/Member cards)
  on settings/members and per-role helper text in the invite dialog. Copy
  mirrors `lib/permissions.ts` — keep the three in sync.
- Why admin and member used to "look the same": event types/schedules
  are per-membership and settings pages were visible-but-disabled, so
  role only mattered behind the scenes. Now the product surface itself
  differs by role.

### Money & surfaces

- All amount displays use **₹ (INR)**: landing pricing, settings/plan,
  `plan-comparison`, admin MRR (`toLocaleString("en-IN")` digit grouping),
  change-plan dialog; `lib/plans.ts` price comment now says INR. Amounts
  unchanged (₹12 Pro / ₹39 Business).
- **Settings shell**: sticky icon'd vertical nav rail on `md+`
  (General/Members/Plan with descriptions), horizontally scrollable chips
  on mobile.
- **Event-type editor**: each tab is a section card (icon tile + title +
  subcopy header band, padded content, `max-w-3xl`); create dialog got an
  icon tile, clearer copy, "Continue to setup →".

### Bug fixes

- `scripts/recompute-customer-counters.ts` could never run: it imported
  `lib/customer-counters.ts`, which is `"server-only"` (throws outside
  RSC). The counter definitions are now inlined in the script (with a
  keep-in-sync note), and `recomputeCustomerCounters` was removed from
  the lib module (knip-clean).
- Demo seeding raced: re-running the seed crashed on duplicate bulk-user
  emails and left an org with 0 members (caught in screenshots). The wipe
  now also clears `owner-*@example.com` users. (Seed script is temp
  tooling, not shipped.)

### Verification

Gates: typecheck 0 · eslint 0 errors / 14 warnings (12 known RHF
`watch()` pattern + 2 same-class `react-hooks/incompatible-library` for
TanStack Table — accepted) · knip baseline-only (`leaveOrganization`,
`useOrg` pre-existing) · verify:plans 20/20 · verify:counters 9/9 ·
`next build` passes. 50+ production-build screenshots reviewed across
desktop 1440 / mobile 390 / dark: landing ₹ Pricing, owner org-wide
bookings with host names, member-gated settings redirect
(`/settings/general → /dashboard`, no Settings nav), role legend, both
reschedule surfaces incl. picked-slot footers and Sunday empty state,
all three data tables (sorting, match + no-match filter states, page 2,
mobile horizontal scroll) and an actual CSV download verified on disk.
Member-vs-owner sidebar/bookings compared side by side. No console/page
errors on the fresh production build.

## Round 4 — Breathing room, width utilization & mobile spacing

User feedback: desktop pages waste the right side of wide screens; tab
buttons, buttons and inputs feel congested; the event-types mobile header is
cramped; reschedule time-slot options render edge-to-edge.

### What changed

- **Global primitive scale-up** (one change, benefits every screen):
  - `components/ui/button.tsx` — default `h-9 px-3.5` (was `h-8 px-2.5`),
    with sm/lg/icon sizes scaled to match.
  - `components/ui/input.tsx` — `h-10 px-3.5 py-2` (was `h-8 px-2.5 py-1`).
  - `components/ui/select.tsx` — trigger `h-10` with wider padding.
  - `components/ui/textarea.tsx` — `px-3.5 py-2.5`.
  - `components/ui/tabs.tsx` — list `h-9`, triggers `px-3.5 py-1`.
  - `components/bookings/booking-tabs.tsx` — underline tabs `px-4 pb-3.5`.
- **Desktop width utilization** (pages no longer clamp to a narrow column):
  - Event editor section cards: `max-w-3xl` → full width; Details,
    Availability and Booking questions forms restructured to responsive
    two-column grids (`lg:grid-cols-2`) with wide row spans where sensible.
  - Org settings form (`org-settings-form.tsx`) — same two-column treatment.
  - Booking detail page: `max-w-3xl` → `max-w-5xl` two-column card grid
    (Meeting details spans both columns when there are no question responses).
  - Customer detail page: `max-w-3xl` → `max-w-6xl`, notes + booking history
    side by side in a 2fr/3fr grid.
- **Event types mobile header**: heading, subheading and CTA now stack with
  `gap-4` (was cramped); "New event type" button goes full-width on mobile
  for thumb reach.
- **Reschedule / booking time slots**: `time-slot-list.tsx` listbox is now
  capped to `max-w-[340px]` with `mx-auto` on mobile and `sm:mx-0` on desktop
  — clear left/right margins in the reschedule dialog and manage page
  (shared with the public booking flow).

### Bug fixes

- Removed dead `db` import left in `lib/customer-counters.ts` by the round-3
  script refactor (eslint warning regression → back to the 13-warning
  baseline of pre-existing RHF `react-hooks/incompatible-library` notices).

### Verification

- Production build; 30+ Playwright screenshots (desktop 1440×900, mobile
  390×844, light + dark) across event types, editor tabs, bookings, booking
  detail, customers, settings, dashboard, reschedule dialog and the public
  booking page — all reviewed visually.
- Slot engine sanity-checked directly against the DB (weekly hours +
  overrides + busy bookings all produce correct slot counts; Aug 27 offsite
  blocked, Aug 29 half-day yields reduced slots).
- Gates: `tsc` 0 errors · `eslint` 0 errors / 13 pre-existing warnings ·
  `knip` at baseline (2 known unused exports) · `verify:plans` 20/20 ·
  `verify:counters` 9/9 · production build green · final smoke of the public
  booking page (slot grid renders, zero console errors).
- Temp tooling removed after verification (playwright devDependency + all
  ad-hoc harness scripts). Nothing committed — working tree only.
