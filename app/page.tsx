import Link from "next/link"
import {
  CalendarClock,
  Clock,
  Users,
  Link as LinkIcon,
  BarChart3,
  Shield,
  Globe,
  Zap,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarClock className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">Appointly</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#workflow"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
          <Badge variant="secondary" className="mb-6">
            <Zap className="mr-1 h-3 w-3" />
            Scheduling that scales with you
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Let clients book you{" "}
            <span className="text-primary">in seconds</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Appointly is the open scheduling platform for teams and freelancers.
            Create booking pages, manage availability, and accept meetings — all
            in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                See how it works
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Free plan available
          </p>
        </div>
      </section>

      {/* Product Preview */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-4 flex-1 rounded-md bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
                app.appointly.dev/acme/dashboard
              </div>
            </div>
            <div className="grid md:grid-cols-[220px_1fr]">
              {/* Mini sidebar */}
              <div className="hidden border-r p-4 md:block">
                <div className="mb-4 flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Appointly
                </div>
                {[
                  { icon: BarChart3, label: "Dashboard", active: true },
                  { icon: Calendar, label: "Bookings" },
                  { icon: LinkIcon, label: "Event types" },
                  { icon: Clock, label: "Availability" },
                  { icon: Users, label: "Customers" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                      item.active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                ))}
              </div>
              {/* Dashboard preview */}
              <div className="p-6">
                <p className="text-xs text-muted-foreground">
                  Welcome back, Sarah
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Upcoming", value: "12", color: "text-blue-500" },
                    {
                      label: "Completed",
                      value: "87",
                      color: "text-emerald-500",
                    },
                    {
                      label: "This month",
                      value: "23",
                      color: "text-violet-500",
                    },
                    {
                      label: "Hours booked",
                      value: "46",
                      color: "text-amber-500",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border bg-muted/50 p-3"
                    >
                      <p className="text-[10px] text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className={`text-xl font-semibold ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-24 rounded-lg border bg-muted/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to schedule smarter
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              From solo freelancers to growing agencies, Appointly adapts to
              your workflow.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: LinkIcon,
                title: "Custom booking pages",
                description:
                  "Create shareable booking links for each service type. Clients pick a time and it's done.",
              },
              {
                icon: Clock,
                title: "Availability rules",
                description:
                  "Set weekly hours, buffer times, and date overrides. You control when you're bookable.",
              },
              {
                icon: Users,
                title: "Team workspaces",
                description:
                  "Invite team members, assign roles, and manage bookings across your entire organization.",
              },
              {
                icon: Calendar,
                title: "Booking management",
                description:
                  "Approve, reschedule, or cancel bookings. View upcoming, past, and pending meetings.",
              },
              {
                icon: MessageSquare,
                title: "Custom questions",
                description:
                  "Collect the information you need upfront with configurable intake questions.",
              },
              {
                icon: BarChart3,
                title: "Analytics dashboard",
                description:
                  "Track booking volume, popular services, busiest times, and customer trends.",
              },
              {
                icon: Users,
                title: "Customer CRM",
                description:
                  "See every client's history, notes, and booking patterns in one organized view.",
              },
              {
                icon: Shield,
                title: "Plan management",
                description:
                  "Free, Pro, and Business tiers with limits enforced at the action level — not just the UI.",
              },
              {
                icon: Globe,
                title: "Timezone support",
                description:
                  "Automatic timezone detection for clients. Your hours always stay correct.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              How it works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in minutes
            </h2>
          </div>
          <div className="mt-16 space-y-12">
            {[
              {
                step: "01",
                title: "Create your workspace",
                description:
                  "Sign up and create an organization. Set your timezone and basic details.",
              },
              {
                step: "02",
                title: "Set your availability",
                description:
                  "Define your weekly hours, add buffer times, and mark date overrides for holidays.",
              },
              {
                step: "03",
                title: "Create event types",
                description:
                  "Build booking links for each service — 15-min calls, 60-min deep dives, anything.",
              },
              {
                step: "04",
                title: "Share and get booked",
                description:
                  "Share your booking page link. Clients pick a time, fill in details, and you're done.",
              },
            ].map((step) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                tagline: "For individuals getting started",
                features: [
                  "2 event types",
                  "Single user workspace",
                  "Unlimited bookings",
                  "Public booking page",
                  "Email notifications",
                ],
                cta: "Get started",
                popular: false,
              },
              {
                name: "Pro",
                price: "$12",
                period: "/month",
                tagline: "For freelancers and small teams",
                features: [
                  "20 event types",
                  "Up to 5 team members",
                  "Custom booking questions",
                  "Booking approvals",
                  "Analytics dashboard",
                ],
                cta: "Start free trial",
                popular: true,
              },
              {
                name: "Business",
                price: "$39",
                period: "/month",
                tagline: "For agencies and growing teams",
                features: [
                  "Unlimited event types",
                  "Unlimited team members",
                  "Customer CRM",
                  "Priority support",
                  "Everything in Pro",
                ],
                cta: "Contact sales",
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border bg-card p-6 ${
                  plan.popular ? "border-primary shadow-lg ring-1 ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    Most popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.tagline}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period !== "forever" && (
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6 block">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to simplify your scheduling?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of professionals who trust Appointly for their
            booking needs.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold">Appointly</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Professional appointment scheduling for teams and freelancers.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-foreground">
                    How it works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Account</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground">
                    Sign up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Appointly, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
