import Link from "next/link"
import { CalendarClock, Clock, Link2, Users } from "lucide-react"
import { Brand } from "@/components/layout/brand"
import { ThemeToggle } from "@/components/theme-toggle"

const HIGHLIGHTS = [
  {
    icon: Link2,
    title: "Share one link",
    description: "Event types with durations, buffers and custom questions.",
  },
  {
    icon: Clock,
    title: "Availability that respects reality",
    description: "Working hours, date overrides and time zones handled.",
  },
  {
    icon: Users,
    title: "Built for teams",
    description: "Roles, invitations and workspaces that switch in one click.",
  },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_24rem_at_-10%_-10%,color-mix(in_oklch,white_14%,transparent),transparent),radial-gradient(32rem_20rem_at_110%_110%,color-mix(in_oklch,black_16%,transparent),transparent)]"
        />
        <Link href="/" className="relative z-10">
          <Brand
            iconClassName="bg-white/15 text-white"
            labelClassName="text-white"
          />
        </Link>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <CalendarClock className="size-8 opacity-70" />
            <h2 className="max-w-md text-2xl leading-snug font-semibold text-balance">
              Your calendar, open for business — on your terms.
            </h2>
          </div>
          <ul className="max-w-md space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-primary-foreground/70">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Appointly
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-block lg:hidden"
            aria-label="Appointly home"
          >
            <Brand />
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
