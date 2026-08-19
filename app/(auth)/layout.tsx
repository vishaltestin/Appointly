import Link from "next/link"
import { CalendarClock } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600/20 via-transparent to-transparent" />
        <Link href="/" className="z-10 flex items-center gap-2">
          <CalendarClock className="h-6 w-6" />
          <span className="text-lg font-semibold">Appointly</span>
        </Link>
        <div className="z-10 space-y-4">
          <blockquote className="text-2xl leading-relaxed font-medium">
            &quot;Appointly cut our no-show rate in half and gave our team hours
            back every week.&quot;
          </blockquote>
          <p className="text-sm text-zinc-400">— Head of Ops, Modern Studio</p>
        </div>
        <p className="z-10 text-xs text-zinc-500">
          © {new Date().getFullYear()} Appointly, Inc.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
