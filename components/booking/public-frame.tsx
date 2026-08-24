import Link from "next/link"

/**
 * Shared frame for every public, attendee-facing route (/book/…, /manage/…):
 * quiet background with a faint brand glow, content centered, humble footer.
 */
export function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col bg-muted/40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(42rem_18rem_at_50%_-6rem,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
      />
      <main className="relative flex flex-1 flex-col">{children}</main>
      <footer className="relative border-t bg-background/60 py-5">
        <p className="text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link
            href="/"
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            Appointly
          </Link>{" "}
          — scheduling for modern teams
        </p>
      </footer>
    </div>
  )
}
