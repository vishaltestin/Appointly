import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  Clock,
  Globe,
  Link2,
  MapPin,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react"
import { auth } from "@/auth"
import { Brand } from "@/components/layout/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { LinkButton } from "@/components/shared/link-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PLANS, PLAN_ORDER } from "@/lib/plans"

const FEATURES = [
  {
    icon: Link2,
    title: "Event types & booking links",
    description:
      "Create 15-minute intros or 2-hour workshops, each with its own public link. Custom questions capture what you need up front.",
  },
  {
    icon: Clock,
    title: "Real availability engine",
    description:
      "Weekly hours, buffers, date overrides, minimum notice and time zones — the slot math handles it, not you.",
  },
  {
    icon: Users,
    title: "Team workspaces",
    description:
      "Invite teammates with roles, give everyone their own schedule, and switch between workspaces without logging out.",
  },
  {
    icon: CalendarClock,
    title: "Full booking lifecycle",
    description:
      "Approvals, reschedules and cancellations — with a self-serve manage link attendees can use without an account.",
  },
  {
    icon: BarChart3,
    title: "Customers & analytics",
    description:
      "Every booking builds a customer record automatically — with per-customer booking links, notes and full history at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Admin & plan controls",
    description:
      "Plan limits are enforced by the server, suspensions apply instantly, and every plan change leaves an audit trail.",
  },
]

const STEPS = [
  {
    step: "01",
    title: "Create an event type",
    description:
      "Name it, set the duration and location, and attach your availability. Takes under a minute.",
  },
  {
    step: "02",
    title: "Share your link",
    description:
      "Send appointly.co/you/intro-call or drop it in your email signature and website.",
  },
  {
    step: "03",
    title: "Watch bookings roll in",
    description:
      "Attendees pick a time that works. You both get the details, the reminders and the .ics file.",
  },
]

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const session = await auth()
  const signedIn = !!session?.user

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <LandingNav signedIn={signedIn} />

      <main className="flex-1">
        <HeroSection signedIn={signedIn} />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CtaSection signedIn={signedIn} />
      </main>

      <LandingFooter />
    </div>
  )
}

/* ── Navigation ────────────────────────────────────────────────────────── */

function LandingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Appointly home">
          <Brand />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <LinkButton href="/app">
              Open Appointly
              <ArrowRight />
            </LinkButton>
          ) : (
            <>
              <LinkButton
                variant="ghost"
                className="hidden sm:inline-flex"
                href="/login"
              >
                Sign in
              </LinkButton>
              <LinkButton href="/register">
                Get started
                <ArrowRight />
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function HeroSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* soft indigo aura behind the mock */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(45rem_20rem_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="max-w-xl">
          <Badge
            variant="secondary"
            className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/15"
          >
            <Globe className="size-3" />
            Multi-tenant scheduling platform
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            Scheduling that works the way your team does
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Appointly gives every teammate a booking link backed by real
            availability rules — with approvals, reminders, a customer CRM and
            analytics built in. No back-and-forth emails, ever again.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {signedIn ? (
              <LinkButton size="lg" href="/app">
                Go to your workspace
                <ArrowRight />
              </LinkButton>
            ) : (
              <>
                <LinkButton size="lg" href="/register">
                  Start scheduling — free
                  <ArrowRight />
                </LinkButton>
                <LinkButton size="lg" variant="outline" href="/login">
                  Sign in
                </LinkButton>
              </>
            )}
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Free plan included", "No credit card required", "Set up in minutes"].map(
              (item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

        <HeroPreview />
      </div>
    </section>
  )
}

/** A pure-CSS mock of the public booking flow — always sharp, no images. */
function HeroPreview() {
  const days = ["S", "M", "T", "W", "T", "F", "S"]
  // One mock month row-set; the 18th is the selected day.
  const cells: (number | null)[] = [
    null,
    null,
    null,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
  ]
  const enabled = new Set([8, 9, 10, 15, 16, 17, 18, 22, 23, 24, 29, 30])
  const slots = ["9:00 AM", "9:30 AM", "10:00 AM", "11:30 AM", "1:00 PM"]

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-2xl dark:bg-primary/15"
      />
      <div className="relative rounded-2xl border bg-card shadow-2xl shadow-primary/10">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 border-b px-4 py-3">
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          <span className="ml-3 flex h-6 flex-1 items-center gap-1.5 rounded-md bg-muted px-2 text-[11px] text-muted-foreground">
            <Globe className="size-3" />
            appointly.co/acme-studio/intro-call
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1.2fr]">
          {/* event info */}
          <div className="space-y-3 border-b pb-4 sm:border-r sm:border-b-0 sm:pr-4 sm:pb-0">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                A
              </span>
              <div>
                <p className="text-sm font-medium">Acme Studio</p>
                <p className="text-xs text-muted-foreground">with Amara</p>
              </div>
            </div>
            <p className="text-base font-semibold">Intro call</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> 30 min
              </p>
              <p className="flex items-center gap-1.5">
                <Video className="size-3.5" /> Google Meet
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Your time zone
              </p>
            </div>
          </div>

          {/* calendar + slots */}
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
                {days.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                {cells.map((day, i) =>
                  day === null ? (
                    <span key={i} />
                  ) : (
                    <span
                      key={i}
                      className={cn(
                        "flex h-6 items-center justify-center rounded-md",
                        day === 18
                          ? "bg-primary font-semibold text-primary-foreground"
                          : enabled.has(day)
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground/40"
                      )}
                    >
                      {day}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {slots.map((slot, i) => (
                <span
                  key={slot}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] font-medium",
                    i === 1
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-foreground/80"
                  )}
                >
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* floating confirmation */}
      <div className="absolute -bottom-6 -left-4 hidden items-center gap-2.5 rounded-xl border bg-card p-3 shadow-lg sm:flex">
        <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <div>
          <p className="text-xs font-semibold">Booking confirmed</p>
          <p className="text-[11px] text-muted-foreground">
            Thu, Jan 18 · 9:30–10:00 AM
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Features ──────────────────────────────────────────────────────────── */

function FeaturesSection() {
  return (
    <section id="features" className="border-t bg-muted/40 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Everything between “When works for you?” and “See you then”
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The full lifecycle is covered — from the first click on your link
            to the follow-up after the meeting.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="bg-background/60">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── How it works ──────────────────────────────────────────────────────── */

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Bookable in three steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From signup to a shareable booking page in less time than it takes
            to type “does Tuesday work?”
          </p>
        </div>
        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((item) => (
            <li key={item.step} className="relative">
              <p className="font-mono text-sm font-medium text-primary">
                {item.step}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ── Pricing ───────────────────────────────────────────────────────────── */

function PricingSection() {
  return (
    <section
      id="pricing"
      className="border-t bg-muted/40 py-16 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Simple plans that grow with you
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when your team does — limits are enforced
            fairly, and downgrade never deletes your data.
          </p>
        </div>
        <div className="mt-14 grid gap-4 lg:mt-16 lg:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId]
            const highlighted = planId === "PRO"
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col overflow-visible bg-background/60 transition-shadow duration-200 hover:shadow-md",
                  highlighted &&
                    "shadow-xl shadow-primary/10 ring-2 ring-primary lg:-translate-y-2"
                )}
              >
                {highlighted && (
                  <Badge
                    variant="default"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 shadow-md"
                  >
                    Most popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.tagline}</CardDescription>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.price === 0 ? " forever" : " / month"}
                    </span>
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <LinkButton
                    variant={highlighted ? "default" : "outline"}
                    className="w-full"
                    href="/register"
                  >
                    {plan.price === 0 ? "Start for free" : `Choose ${plan.name}`}
                  </LinkButton>
                </CardFooter>
              </Card>
            )
          })}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Plans are managed by your workspace owner — no self-serve checkout
          to wrangle.
        </p>
      </div>
    </section>
  )
}

/* ── Final CTA ─────────────────────────────────────────────────────────── */

function CtaSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(35rem_16rem_at_50%_120%,color-mix(in_oklch,white_18%,transparent),transparent)]"
          />
          <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Ready to stop playing calendar tag?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Create your workspace, share your first link, and take your first
            booking today.
          </p>
          <div className="relative mt-8">
            <LinkButton
              size="lg"
              variant="secondary"
              href={signedIn ? "/app" : "/register"}
            >
              {signedIn ? "Open your workspace" : "Create your free workspace"}
              <ArrowRight />
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ────────────────────────────────────────────────────────────── */

function LandingFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Appointment scheduling for teams that value their time —
              from solo freelancers to growing agencies.
            </p>
          </div>
          <FooterColumn
            title="Product"
            links={[
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Pricing", href: "#pricing" },
            ]}
          />
          <FooterColumn
            title="Get started"
            links={[
              { label: "Create account", href: "/register" },
              { label: "Sign in", href: "/login" },
            ]}
          />
          <FooterColumn
            title="Workspace"
            links={[
              { label: "Dashboard", href: "/app" },
              { label: "Platform admin", href: "/admin" },
            ]}
          />
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Appointly. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Built with Next.js, Prisma and shadcn/ui
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <nav aria-label={title}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
