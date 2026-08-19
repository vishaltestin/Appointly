import Link from "next/link"
import { CalendarClock, Sparkles, Shield, Clock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
        <Link
          href="/"
          className="z-10 flex items-center gap-2 text-primary-foreground"
        >
          <CalendarClock className="h-6 w-6" />
          <span className="text-lg font-semibold">Appointly</span>
        </Link>
        <div className="z-10 space-y-6">
          <blockquote className="text-2xl leading-relaxed font-medium">
            &quot;Appointly cut our no-show rate in half and gave our team hours
            back every week.&quot;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20" />
            <div>
              <p className="text-sm font-medium">Sarah Chen</p>
              <p className="text-xs text-primary-foreground/70">
                Head of Ops, Modern Studio
              </p>
            </div>
          </div>
          <div className="flex gap-6 pt-4">
            {[
              { icon: Sparkles, text: "Free plan available" },
              { icon: Clock, text: "Set up in 2 minutes" },
              { icon: Shield, text: "Secure & private" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm">
                <item.icon className="h-4 w-4" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
        <p className="z-10 text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Appointly, Inc.
        </p>
      </div>

      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
