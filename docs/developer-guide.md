# Appointly Developer Guide

This guide covers the technical architecture, setup, and development workflow for Appointly.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Database](#database)
6. [Authentication](#authentication)
7. [Architecture](#architecture)
8. [Development](#development)
9. [Key Patterns](#key-patterns)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Database | MySQL 8+ / MariaDB |
| ORM | Prisma 7 |
| Auth | Auth.js v5 (NextAuth) |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (base-nova style) |
| State | Server Components + React Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8+ or MariaDB 10.5+
- npm or yarn

### Setup

```bash
# Clone and install
git clone <repo-url>
cd Appointly
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
# Or for development: npx prisma migrate dev

# Seed the database (creates first super admin)
npm run db:seed

# Start development server
npm run dev
```

Open http://localhost:3000 and sign in with the seeded admin credentials.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run format` | Prettier formatting |
| `npm run knip` | Find unused code |
| `npm run db:seed` | Seed the database |
| `npm run verify:plans` | Verify plan limit calculations |

---

## Project Structure

```
Appointly/
├── actions/                    # Server Actions (all mutations)
│   ├── admin.actions.ts        # Platform admin operations
│   ├── auth.actions.ts         # Authentication actions
│   ├── availability.actions.ts # Schedule & availability
│   ├── billing.actions.ts      # Plan management
│   ├── booking-lifecycle.actions.ts  # Cancel/reschedule
│   ├── booking.actions.ts      # Booking CRUD
│   ├── customer.actions.ts     # Customer management
│   ├── dashboard.actions.ts    # Dashboard data
│   ├── event-type.actions.ts   # Event type CRUD
│   ├── member.actions.ts       # Team management
│   └── organization.actions.ts # Org CRUD
│
├── app/
│   ├── (auth)/                 # Auth pages (login, register)
│   ├── admin/                  # Platform admin panel
│   ├── api/                    # API routes (cron jobs)
│   ├── app/[orgSlug]/          # Tenant application
│   │   ├── availability/       # Schedule management
│   │   ├── bookings/           # Booking management
│   │   ├── customers/          # Customer CRM
│   │   ├── dashboard/          # Dashboard
│   │   ├── event-types/        # Event type management
│   │   └── settings/           # Workspace settings
│   ├── book/[orgSlug]/         # Public booking pages
│   ├── invite/[token]/         # Invitation acceptance
│   └── manage/[token]/         # Attendee self-service
│
├── components/
│   ├── admin/                  # Admin panel components
│   ├── auth/                   # Authentication components
│   ├── availability/           # Availability components
│   ├── billing/                # Billing components
│   ├── booking/                # Booking flow components
│   ├── bookings/               # Booking management components
│   ├── customers/              # Customer components
│   ├── dashboard/              # Dashboard components
│   ├── event-types/            # Event type components
│   ├── layout/                 # Layout components (sidebar, header)
│   ├── organization/           # Organization components
│   ├── providers/              # React providers
│   ├── shared/                 # Shared components
│   ├── team/                   # Team management components
│   └── ui/                     # shadcn/ui components
│
├── generated/
│   └── prisma/                 # Generated Prisma client
│
├── hooks/                      # Custom React hooks
├── lib/                        # Domain logic & utilities
│   ├── validations/            # Zod schemas
│   ├── availability.ts         # Availability calculations
│   ├── booking-engine.ts       # Booking logic
│   ├── customer-counters.ts    # Denormalized counters
│   ├── db.ts                   # Prisma client instance
│   ├── mail.ts                 # Email stubs
│   ├── permissions.ts          # Role-based permissions
│   ├── plans.ts                # Plan definitions & limits
│   ├── session.ts              # Auth session helpers
│   ├── usage.ts                # Usage tracking
│   └── utils.ts                # Utility functions
│
└── prisma/
    ├── schema.prisma           # Database schema
    ├── seed.ts                 # Database seed script
    └── migrations/             # Database migrations
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `AUTH_SECRET` | Yes | Auth.js signing key |
| `NEXTAUTH_URL` | Yes | Canonical app URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL for links |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `CRON_SECRET` | No | Secret for cron job authentication |

### Example `.env`

```env
DATABASE_URL="mysql://user:password@localhost:3306/appointly"
AUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Database

### Schema Overview

The database uses MySQL with the following main entities:

- **User**: Platform users with global roles
- **Organization**: Workspaces with plans and members
- **Membership**: User-org relationship with org-level roles
- **EventType**: Bookable services with configuration
- **Booking**: Scheduled meetings with full snapshot
- **Schedule**: Availability rules with working hours
- **Customer**: Denormalized customer records

### Key Design Decisions

1. **Bookings snapshot context**: `eventTitle`, `durationMinutes`, `hostName`, `hostEmail` are copied onto bookings so deleting event types never destroys history.

2. **Manage tokens**: Attendees manage bookings via crypto-random tokens without authentication.

3. **Denormalized customer counters**: Booking transitions update customer aggregates in the same transaction.

4. **Plan limits**: Enforced at the action level, not just the UI.

### Migrations

```bash
# Create a migration
npx prisma migrate dev --name your-migration-name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Seed Script

The seed script (`prisma/seed.ts`) creates the first super admin user. Run with:

```bash
npm run db:seed
```

---

## Authentication

Appointly uses Auth.js v5 with JWT strategy.

### Flow

1. **Credentials**: Email/password login with bcrypt verification
2. **Google OAuth**: Optional, enabled when env vars are set
3. **Session**: JWT stored in cookies, includes user ID and global role

### Route Protection

- `/app/*` and `/admin/*` require authentication
- `/admin/*` requires SUPER_ADMIN role
- Auth pages redirect to `/app` if already logged in
- Suspended users/orgs are blocked at the session level

### Key Files

- `auth.ts`: Auth.js configuration and providers
- `auth.config.ts`: Route protection callbacks
- `lib/session.ts`: Session helper functions

---

## Architecture

### Server Components

All pages are Server Components by default. Client Components are used only for interactivity (forms, dialogs, dropdowns, etc.).

### Server Actions

All mutations go through Server Actions in the `actions/` directory. Each action:
1. Validates input with Zod
2. Checks permissions
3. Performs the operation
4. Returns `{ error }` or `{ success, data }`

### Multi-tenancy

Every query is scoped by `organizationId` via `requireOrgMembership(orgSlug)`. The organization context is provided through `OrgProvider`.

### Prisma Client

The Prisma client is generated to `generated/prisma/` and imported as `@/generated/prisma/client`.

---

## Development

### Adding a New Page

1. Create the page component in `app/app/[orgSlug]/your-page/page.tsx`
2. Add the route to the sidebar in `components/layout/dashboard-sidebar.tsx`
3. Create any needed Server Actions in `actions/`
4. Add Zod validation schemas in `lib/validations/`
5. Create UI components in `components/`

### Adding a New Server Action

```typescript
"use server"

import { z } from "zod"
import { requireOrgMembership } from "@/lib/session"
import { db } from "@/lib/db"

const schema = z.object({
  // Your validation schema
})

export async function yourAction(orgSlug: string, input: z.infer<typeof schema>) {
  const membership = await requireOrgMembership(orgSlug)
  
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { error: "Invalid input" }
  }

  // Your business logic
  
  return { success: true }
}
```

### Adding a New UI Component

1. Check if shadcn/ui has the component: `npx shadcn@latest add <component>`
2. If not, create it in `components/ui/` following shadcn patterns
3. Use `@base-ui/react` primitives (base-nova style)

### Code Style

- Use TypeScript strict mode
- Prefer Server Components; use `"use client"` only when needed
- Use Zod for all validation
- Use Tailwind CSS for styling
- Follow existing patterns for consistency

---

## Key Patterns

### Form Handling

```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { yourSchema } from "@/lib/validations/your.schema"

export function YourForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(yourSchema),
  })

  function onSubmit(values) {
    // Call server action
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### Data Fetching

```typescript
// Server Component - direct database access
export default async function YourPage({ params }) {
  const { orgSlug } = await params
  const membership = await requireOrgMembership(orgSlug)
  
  const data = await db.yourModel.findMany({
    where: { organizationId: membership.organizationId },
  })

  return <YourComponent data={data} />
}
```

### Error Handling

```typescript
// Server Action
export async function yourAction(orgSlug: string, input: Input) {
  try {
    // Business logic
    return { success: true }
  } catch (error) {
    return { error: "Something went wrong" }
  }
}

// Client Component
function YourComponent() {
  const [error, setError] = useState<string | null>(null)
  
  // Handle errors from server actions
}
```

---

## Deployment

### Build

```bash
npm run build
```

### Environment

Set all required environment variables in your production environment.

### Database

Run migrations before deploying:

```bash
npx prisma migrate deploy
```

### Cron Jobs

Set up the reminder cron job:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.example.com/api/cron/send-reminders
```

Run hourly to email attendees with bookings in the next 24 hours.

---

## Troubleshooting

### Prisma Client Not Generated

```bash
npx prisma generate
```

If this fails due to network issues, check your internet connection and try again.

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Ensure MySQL/MariaDB is running
3. Check firewall rules
4. Verify the database exists

### Authentication Issues

1. Ensure `AUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your deployment URL
3. For Google OAuth, verify client ID and secret

### Build Errors

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Find unused code
npm run knip
```

### Common Issues

- **"Cannot find module '@/generated/prisma/client'"**: Run `npx prisma generate`
- **"Session not found"**: Check `AUTH_SECRET` and cookie settings
- **"Permission denied"**: Check user role and organization membership

---

## Contributing

1. Follow existing code patterns
2. Write TypeScript strict mode code
3. Add Zod schemas for all inputs
4. Test on both desktop and mobile
5. Run typecheck and lint before committing
