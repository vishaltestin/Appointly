/**
 * Demo seed — loads a rich, realistic dataset so every screen has meaningful
 * content: dashboards, org-wide bookings, customers, availability, charts,
 * and the super-admin tables (organizations / users / plan audit trail).
 *
 * Safe to re-run: wipes every row except SUPER_ADMIN users, then recreates
 * the demo set. Plan definitions live in lib/plans.ts (no Plan table).
 *
 *   npx tsx prisma/seed-demo.ts      (or: npm run db:seed:demo)
 */
import { db as prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const DEMO_PASSWORD = "Demo12345"

/** stable pseudo-random in [0,1) per string — keeps reseeds reproducible */
function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

const INDIAN_FIRST = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan",
  "Ananya", "Diya", "Aadhya", "Myra", "Sara", "Ira", "Priya", "Kavya",
  "Rohan", "Kabir", "Vikram", "Nikhil", "Farhan", "Zoya", "Meera", "Tanvi",
]
const INDIAN_LAST = [
  "Sharma", "Verma", "Patel", "Gupta", "Mehta", "Joshi", "Nair", "Iyer",
  "Reddy", "Khan", "Singh", "Chopra", "Malhotra", "Bose", "Das", "Rao",
]

function person(seed: string) {
  const f = INDIAN_FIRST[Math.floor(hash01(seed + "f") * INDIAN_FIRST.length)]
  const l = INDIAN_LAST[Math.floor(hash01(seed + "l") * INDIAN_LAST.length)]
  const email = `${f}.${l}${Math.floor(hash01(seed) * 90 + 10)}@example.com`.toLowerCase()
  return { name: `${f} ${l}`, email }
}

/** midnight UTC `dayOffset` days from today — for @db.Date override columns */
function dayAt(dayOffset: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + dayOffset)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** a Date at `dayOffset` days from today, `istMinutes` past midnight IST */
function at(dayOffset: number, istMinutes: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + dayOffset)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCMinutes(istMinutes - 330) // IST = UTC+5:30
  return d
}

async function main() {
  console.log("◆ Wiping existing demo data…")
  await prisma.$transaction([
    prisma.booking.deleteMany({}),
    prisma.customer.deleteMany({}),
    prisma.eventType.deleteMany({}),
    prisma.schedule.deleteMany({}),
    prisma.invitation.deleteMany({}),
    prisma.planChangeLog.deleteMany({}),
    prisma.session.deleteMany({}),
    prisma.account.deleteMany({}),
    prisma.verificationToken.deleteMany({}),
    prisma.membership.deleteMany({}),
    prisma.organization.deleteMany({}),
    prisma.user.deleteMany({ where: { globalRole: { not: "SUPER_ADMIN" } } }),
  ])

  const password = await bcrypt.hash(DEMO_PASSWORD, 10)

  // ------------------------------------------------------- Acme Studio team
  console.log("◆ Creating Acme Studio (3 members, PRO)…")
  const [amara, dev, riya] = await Promise.all([
    prisma.user.create({ data: { name: "Amara Kapoor", email: "amara@example.com", password, timezone: "Asia/Kolkata" } }),
    prisma.user.create({ data: { name: "Dev Malhotra", email: "dev@example.com", password, timezone: "Asia/Kolkata" } }),
    prisma.user.create({ data: { name: "Riya Nair", email: "riya@example.com", password, timezone: "Asia/Kolkata" } }),
  ])

  const org = await prisma.organization.create({
    data: {
      name: "Acme Studio",
      slug: "acme-studio",
      plan: "PRO",
      timezone: "Asia/Kolkata",
      memberships: {
        create: [
          { userId: amara.id, role: "OWNER" },
          { userId: dev.id, role: "ADMIN" },
          { userId: riya.id, role: "MEMBER" },
        ],
      },
    },
    include: { memberships: true },
  })
  const mAmara = org.memberships.find((m) => m.userId === amara.id)!
  const mDev = org.memberships.find((m) => m.userId === dev.id)!
  const mRiya = org.memberships.find((m) => m.userId === riya.id)!

  // ------------------------------------------------------------- schedules
  console.log("◆ Creating schedules…")
  async function makeSchedule(
    membershipId: string,
    start: string,
    end: string,
    overrides: { offset: number; type: "UNAVAILABLE" | "CUSTOM_HOURS"; startTime?: string; endTime?: string; reason: string }[] = []
  ) {
    return prisma.schedule.create({
      data: {
        membershipId,
        name: "Working hours",
        timezone: "Asia/Kolkata",
        isDefault: true,
        workingHours: {
          create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startTime: start, endTime: end })),
        },
        dateOverrides: {
          create: overrides.map((o) => ({
            date: dayAt(o.offset),
            type: o.type,
            startTime: o.startTime ?? null,
            endTime: o.endTime ?? null,
            reason: o.reason,
          })),
        },
      },
      include: { workingHours: true, dateOverrides: true },
    })
  }

  const sAmara = await makeSchedule(mAmara.id, "09:00", "17:00", [
    { offset: 3, type: "UNAVAILABLE", reason: "Team offsite" },
    { offset: 5, type: "CUSTOM_HOURS", startTime: "11:00", endTime: "15:00", reason: "Half day" },
  ])
  const sDev = await makeSchedule(mDev.id, "10:00", "18:00")
  const sRiya = await makeSchedule(mRiya.id, "09:30", "16:30", [
    { offset: 9, type: "UNAVAILABLE", reason: "On leave" },
  ])

  // ----------------------------------------------------------- event types
  console.log("◆ Creating event types…")
  const etCoffee = await prisma.eventType.create({
    data: {
      organizationId: org.id, membershipId: mAmara.id, scheduleId: sAmara.id,
      title: "Coffee chat", slug: "coffee-chat",
      description: "A quick 15 minute hello — bring your own coffee.",
      durationMinutes: 15, color: "#00339c",
      locationType: "ONLINE_MEETING", locationValue: "https://meet.google.com/abc-defg-hij",
      minimumNoticeMinutes: 120,
    },
  })
  const etPortfolio = await prisma.eventType.create({
    data: {
      organizationId: org.id, membershipId: mAmara.id, scheduleId: sAmara.id,
      title: "Portfolio review", slug: "portfolio-review",
      description: "Deep-dive on your portfolio with clear, actionable feedback.",
      durationMinutes: 45, color: "#176cb6",
      locationType: "ONLINE_MEETING", locationValue: "https://meet.google.com/klm-nopq-rst",
      minimumNoticeMinutes: 1440, requiresConfirmation: true,
      questions: {
        create: [
          { label: "Portfolio URL", type: "TEXT", required: true, order: 0 },
          { label: "What should we focus on?", type: "TEXTAREA", required: false, order: 1 },
        ],
      },
    },
    include: { questions: true },
  })
  const etStrategy = await prisma.eventType.create({
    data: {
      organizationId: org.id, membershipId: mAmara.id, scheduleId: sAmara.id,
      title: "Strategy call", slug: "strategy-call",
      description: "A full hour to map goals, blockers and next steps.",
      durationMinutes: 60, color: "#ca8a04",
      locationType: "PHONE_CALL", locationValue: null,
      minimumNoticeMinutes: 720,
    },
  })
  const etDesign = await prisma.eventType.create({
    data: {
      organizationId: org.id, membershipId: mDev.id, scheduleId: sDev.id,
      title: "Design critique", slug: "design-critique",
      description: "Structured critique of one screen or flow.",
      durationMinutes: 30, color: "#7c3aed",
      locationType: "ONLINE_MEETING", locationValue: "https://meet.google.com/uvw-xyza-bcd",
      minimumNoticeMinutes: 240,
    },
  })
  const etSupport = await prisma.eventType.create({
    data: {
      organizationId: org.id, membershipId: mRiya.id, scheduleId: sRiya.id,
      title: "Support check-in", slug: "support-check-in",
      description: "Quick sync to unblock you.",
      durationMinutes: 20, color: "#16a34a",
      locationType: "IN_PERSON", locationValue: "Acme Studio, Connaught Place, New Delhi",
      minimumNoticeMinutes: 60,
    },
  })

  // ------------------------------------------------------ bookings+customers
  console.log("◆ Creating customers and bookings…")

  type ET = { id: string; title: string; slug: string; durationMinutes: number }
  type Host = { membershipId: string; name: string; email: string }

  const HOSTS: Record<string, Host> = {
    amara: { membershipId: mAmara.id, name: "Amara Kapoor", email: "amara@example.com" },
    dev: { membershipId: mDev.id, name: "Dev Malhotra", email: "dev@example.com" },
    riya: { membershipId: mRiya.id, name: "Riya Nair", email: "riya@example.com" },
  }

  interface Seed {
    host: keyof typeof HOSTS
    et: ET
    seed: string
    offset: number
    istMin: number
    status: "CONFIRMED" | "PENDING" | "CANCELLED"
    notes?: string
    responses?: Record<string, string>
  }

  const portfolioQs = etPortfolio.questions
  const bookings: Seed[] = []

  // Spread over past 9 days and next 12 days
  const offsets = [-9, -8, -8, -6, -5, -5, -4, -3, -3, -2, -1, 0, 0, 1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 10, 12]
  const slotsIst = [10 * 60, 11 * 60 + 30, 14 * 60, 15 * 60 + 30, 9 * 60 + 30, 13 * 60, 16 * 60, 11 * 60, 14 * 60 + 30, 10 * 60 + 30, 15 * 60, 12 * 60, 16 * 60 + 30, 9 * 60, 13 * 60 + 30, 11 * 60 + 30, 15 * 60 + 30, 10 * 60, 14 * 60, 16 * 60, 11 * 60, 13 * 60, 15 * 60, 10 * 60 + 30, 12 * 60 + 30]
  const route: Array<[keyof typeof HOSTS, ET]> = [
    ["amara", etCoffee], ["amara", etPortfolio], ["amara", etStrategy],
    ["dev", etDesign], ["riya", etSupport],
  ]

  for (let i = 0; i < offsets.length; i++) {
    const offset = offsets[i]
    const [host, et] = route[i % route.length]
    const status: Seed["status"] =
      offset < 0
        ? i % 6 === 5 ? "CANCELLED" : "CONFIRMED"
        : et.id === etPortfolio.id
          ? "PENDING" // approval-gated event type keeps requests pending
          : i % 8 === 7 ? "PENDING" : "CONFIRMED"

    bookings.push({
      host, et, seed: `guest-${i}-${et.slug}`, offset,
      istMin: slotsIst[i], status,
      responses:
        et.id === etPortfolio.id
          ? {
              [portfolioQs[0].id]: `https://portfolio-${i}.example.com`,
              [portfolioQs[1].id]: i % 2 === 0 ? "Case study structure and visual polish." : "",
            }
          : undefined,
      notes: i % 5 === 4 ? "Followed the link from our newsletter." : undefined,
    })
  }

  // A handful of repeat customers (same email, multiple bookings)
  const repeatCustomers = [
    { name: "Jonas Fernandes", email: "jonas.f@example.com", tz: "Asia/Kolkata" },
    { name: "Sana Sheikh", email: "sana.s@example.com", tz: "Asia/Kolkata" },
    { name: "Karthik Menon", email: "karthik.m@example.com", tz: "Asia/Kolkata" },
  ]
  ;[0, 1, 2].forEach((rc, idx) => {
    const p = repeatCustomers[idx]
    bookings.push(
      { host: "amara", et: etCoffee, seed: "", offset: -6 + idx, istMin: 10 * 60 + idx * 30, status: "CONFIRMED" },
      { host: "amara", et: etCoffee, seed: "", offset: -2 + idx, istMin: 15 * 60 + idx * 30, status: "CONFIRMED" },
      { host: "amara", et: etStrategy, seed: "", offset: 2 + idx * 2, istMin: 11 * 60 + idx * 30, status: idx === 2 ? "PENDING" : "CONFIRMED" },
    )
    // mark with explicit attendee instead of generated person
    for (let k = bookings.length - 3; k < bookings.length; k++) {
      ;(bookings[k] as Seed & { attendee?: { name: string; email: string } }).attendee = p
    }
  })

  const customerTouched = new Map<string, { name: string; email: string }>()

  for (const b of bookings) {
    const explicit = (b as Seed & { attendee?: { name: string; email: string } }).attendee
    const p = explicit ?? person(b.seed)
    customerTouched.set(p.email, p)

    const startTime = at(b.offset, b.istMin)
    const endTime = new Date(startTime.getTime() + b.et.durationMinutes * 60000)
    // Spread createdAt so the dashboard "booking volume" chart shows a
    // realistic 30-day curve instead of one spike on reseed day. Bookings
    // are typically made 2–10 days ahead of the meeting; never in the future.
    const leadDays = 2 + hash01(p.email + b.istMin) * 8
    const createdGuess = new Date(startTime.getTime() - leadDays * 86400_000)
    const createdAt = createdGuess.getTime() > Date.now() ? new Date(Date.now() - hash01(p.email) * 86400_000) : createdGuess

    const customer = await prisma.customer.upsert({
      where: { organizationId_email: { organizationId: org.id, email: p.email } },
      update: {},
      create: { organizationId: org.id, name: p.name, email: p.email, timezone: "Asia/Kolkata" },
    })

    await prisma.booking.create({
      data: {
        organizationId: org.id,
        eventTypeId: b.et.id,
        eventTitle: b.et.title,
        durationMinutes: b.et.durationMinutes,
        hostMembershipId: HOSTS[b.host].membershipId,
        hostName: HOSTS[b.host].name,
        hostEmail: HOSTS[b.host].email,
        hostTimezone: "Asia/Kolkata",
        customerId: customer.id,
        attendeeName: p.name,
        attendeeEmail: p.email,
        attendeeTimezone: "Asia/Kolkata",
        attendeeNotes: b.notes ?? null,
        responses: b.responses ?? undefined,
        startTime,
        endTime,
        createdAt,
        status: b.status,
        ...(b.status === "CANCELLED"
          ? { cancelledAt: new Date(startTime.getTime() - 26 * 3600_000), cancelledBy: "ATTENDEE" as const }
          : {}),
      },
    })
  }

  // Recompute customer aggregates with the exact production definitions.
  console.log("◆ Recomputing customer aggregates…")
  for (const [, p] of customerTouched) {
    const customer = await prisma.customer.findUnique({
      where: { organizationId_email: { organizationId: org.id, email: p.email } },
    })
    if (!customer) continue
    const [total, completed, cancelled, bounds] = await Promise.all([
      prisma.booking.count({ where: { customerId: customer.id, rescheduledTo: null } }),
      prisma.booking.count({ where: { customerId: customer.id, status: "CONFIRMED" } }),
      prisma.booking.count({ where: { customerId: customer.id, status: "CANCELLED", rescheduledTo: null } }),
      prisma.booking.aggregate({ where: { customerId: customer.id }, _min: { startTime: true }, _max: { startTime: true } }),
    ])
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalBookings: total,
        completedBookings: completed,
        cancelledBookings: cancelled,
        firstBookingAt: bounds._min.startTime,
        lastBookingAt: bounds._max.startTime,
      },
    })
  }

  // -------------------------------------------- solo orgs for the admin app
  console.log("◆ Creating solo organizations for the admin tables…")
  const soloOrgs: Array<{ name: string; slug: string; plan: "FREE" | "PRO" | "BUSINESS"; suspended?: boolean; ageDays: number }> = [
    { name: "Nimbus Photography", slug: "nimbus-photography", plan: "PRO", ageDays: 84 },
    { name: "Kavya Yoga Collective", slug: "kavya-yoga", plan: "FREE", ageDays: 71 },
    { name: "Ledger & Sons CA", slug: "ledger-sons", plan: "BUSINESS", ageDays: 66 },
    { name: "Pixelmend Studio", slug: "pixelmend-studio", plan: "FREE", ageDays: 52 },
    { name: "Arora Dental Care", slug: "arora-dental", plan: "PRO", ageDays: 47 },
    { name: "The Tattoo Factory", slug: "tattoo-factory", plan: "FREE", ageDays: 39 },
    { name: "Mindful Therapy", slug: "mindful-therapy", plan: "PRO", ageDays: 31 },
    { name: "Spammy Scheduler", slug: "spammy-scheduler", plan: "FREE", suspended: true, ageDays: 26 },
    { name: "Verde Interiors", slug: "verde-interiors", plan: "BUSINESS", ageDays: 18 },
    { name: "Fitfuel Coaching", slug: "fitfuel-coaching", plan: "FREE", ageDays: 9 },
    { name: "Craft & Crumb Bakery", slug: "craft-crumb", plan: "PRO", ageDays: 4 },
    { name: "Zenith Tutors", slug: "zenith-tutors", plan: "FREE", ageDays: 1 },
  ]

  const admin = await prisma.user.findFirst({ where: { globalRole: "SUPER_ADMIN" } })
  let planLogCount = 0

  for (const so of soloOrgs) {
    const ownerName = person(so.slug)
    const ownerEmail = `owner-${so.slug}@example.com`
    const createdAt = new Date(Date.now() - so.ageDays * 86400_000)
    const user = await prisma.user.create({
      data: { name: ownerName.name, email: ownerEmail, password, createdAt },
    })
    const solo = await prisma.organization.create({
      data: {
        name: so.name,
        slug: so.slug,
        plan: so.plan,
        status: so.suspended ? "SUSPENDED" : "ACTIVE",
        createdAt,
        memberships: { create: [{ userId: user.id, role: "OWNER" }] },
      },
      include: { memberships: true },
    })
    // minimal default schedule so their public pages are not broken
    const m = solo.memberships[0]
    const sched = await prisma.schedule.create({
      data: {
        membershipId: m.id, name: "Working hours", timezone: "Asia/Kolkata", isDefault: true,
        workingHours: { create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startTime: "10:00", endTime: "18:00" })) },
      },
    })
    await prisma.eventType.create({
      data: {
        organizationId: solo.id, membershipId: m.id, scheduleId: sched.id,
        title: "Intro call", slug: "intro-call", description: "A short intro call.",
        durationMinutes: 30, locationType: "ONLINE_MEETING", locationValue: null,
      },
    })

    // a couple of plan-change audit rows for two of the orgs
    if (admin && (so.plan === "BUSINESS" || so.plan === "PRO") && planLogCount < 4) {
      await prisma.planChangeLog.create({
        data: {
          organizationId: solo.id,
          fromPlan: so.plan === "BUSINESS" ? "PRO" : "FREE",
          toPlan: so.plan,
          changedBy: admin.id,
          notes: so.plan === "BUSINESS" ? "Annual billing commitment" : "Requested via support",
          createdAt: new Date(createdAt.getTime() + 5 * 86400_000),
        },
      })
      planLogCount++
    }
  }

  const counts = await prisma.$transaction([
    prisma.user.count(), prisma.organization.count(), prisma.eventType.count(),
    prisma.booking.count(), prisma.customer.count(),
  ])
  console.log("\n✔ Demo data ready:")
  console.log(`  users=${counts[0]} organizations=${counts[1]} eventTypes=${counts[2]} bookings=${counts[3]} customers=${counts[4]}`)
  console.log("\n  Demo logins (password: " + DEMO_PASSWORD + "):")
  console.log("   · amara@example.com — Acme Studio OWNER")
  console.log("   · dev@example.com   — Acme Studio ADMIN")
  console.log("   · riya@example.com  — Acme Studio MEMBER")
  console.log("   · admin@appointly.dev — SUPER_ADMIN (unchanged)")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
