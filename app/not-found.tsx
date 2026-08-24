import { Compass } from "lucide-react"
import { LinkButton } from "@/components/shared/link-button"
import { Brand } from "@/components/layout/brand"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6 text-center">
      <Brand />
      <div className="space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
          <Compass className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <LinkButton href="/">Back to home</LinkButton>
        <LinkButton href="/app" variant="outline">
          Go to your workspace
        </LinkButton>
      </div>
    </div>
  )
}
