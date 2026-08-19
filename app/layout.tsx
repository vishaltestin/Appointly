import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: {
    default: "Appointly — Appointment Scheduling Made Simple",
    template: "%s | Appointly",
  },
  description:
    "Multi-tenant SaaS appointment scheduling with event types, public booking pages, availability rules, team workspaces, and customer CRM.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased font-sans")}
    >
      <body>
        <QueryProvider>
          <ThemeProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
