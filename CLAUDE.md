# Appointly — Project Context

> This file is the canonical context source for AI-assisted development on Appointly.
> Always read this before writing any code. Update it after completing each module.

---

## Project Overview

Appointly is a multi-tenant SaaS appointment scheduling platform (competing with Cal.com / Calendly). It helps businesses, freelancers, agencies, consultants, coaches, and healthcare professionals manage bookings.

**Brand:** Appointly — premium, professional, clean. UI inspired by Cal.com, Calendly, Notion, Stripe Dashboard, and Linear.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Forms | React Hook Form + Zod validation |
| Data Fetching | TanStack Query (client), Server Actions (mutations) |
| ORM | Prisma |
| Database | MySQL |
| Auth | Auth.js v5 (next-auth@beta) |
| Charts | Recharts |

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
│   ├── booking.actions.ts
│   ├── booking-management.actions.ts  # Cancel, reschedule, approve, decline
│   ├── customer.actions.ts
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
│   ├── customer-upsert.ts         # Customer upsert on booking create
│   ├── ics.ts                     # ICS calendar file generation
│   ├── timezones.ts               # COMMON_TIMEZONES list
│   └── validations/               # Zod schemas
│       ├── auth.schema.ts
│       ├── org.schema.ts
│       ├── availability.schema.ts
│       ├── event-type.schema.ts
│       ├── booking.schema.ts
│       ├── booking-management.schema.ts
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

| # | Module | Status |
|---|--------|--------|
| 1 | Foundation + Auth (Auth.js v5, JWT, credentials + Google OAuth) | ✅ Complete |
| 2 | Organization/Workspace + Team Members & Roles (invitations, membership) | ✅ Complete |
| 3 | Admin dashboard + route gates + middleware.ts | ✅ Complete |
| 4 | Availability engine (working hours, buffers, breaks, holidays, date overrides) | ✅ Complete |
| 5 | Booking pages + public scheduling flow (event types, booking engine, ICS) | ✅ Complete |
| 6 | Booking lifecycle (cancel, reschedule, approve/decline, reminders, emails) | ✅ Complete |
| 7 | Customer management + Dashboard analytics | ✅ Complete |
| 8 | Billing/subscriptions + dark mode polish | 🔲 Next |

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
7. `manual_billing` — SubscriptionPlan enum, Organization.plan/planChangedBy/planChangedAt/planNotes, PlanChangeLog model (schema only — no implementation yet)

> Note: Prisma client is generated to `../generated/prisma`. Import with `from "@/generated/prisma/client"`.

---

## What's Next: Module 8

### Billing & Subscriptions
- **Schema is ready** — `SubscriptionPlan` enum, plan fields on `Organization`, `PlanChangeLog` model already exist
- Plan tiers (Free / Pro / Business) with limits
- Admin can manually change org plans (no payment gateway — collect payment offline)
- Feature gates: limit event types and team members per plan
- Plan & Usage settings page for org owners (usage meters, plan comparison)
- Audit trail for plan changes

### Dark Mode Polish
- Audit all pages for dark mode consistency
- Fix Recharts theming (use CSS variables instead of hardcoded colors)
- Status badges dark mode contrast
- Ensure no hardcoded `bg-white`, `text-black`, `border-gray-*` anywhere

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
