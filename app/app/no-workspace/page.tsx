import Link from "next/link"
import { redirect } from "next/navigation"
import { Building2, Mail, PlusCircle } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CopyEmailButton } from "@/components/shared/copy-email-button"

export default async function NoWorkspacePage() {
  const sessionUser = await requireAuth()

  // Self-correcting guard: if this user actually does have a workspace
  // (e.g. re-invited since landing here, or navigated here directly by
  // mistake), don't strand them — send them on immediately.
  const membership = await db.membership.findFirst({
    where: { userId: sessionUser.id! },
    orderBy: { createdAt: "asc" },
    include: { organization: true },
  })
  if (membership) redirect(`/app/${membership.organization.slug}/dashboard`)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            You&apos;re not part of a workspace yet
          </h1>
          <p className="text-sm text-muted-foreground">
            You may have left, been removed, or simply haven&apos;t joined one.
            Here&apos;s how to get back in.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <PlusCircle className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Create a workspace</CardTitle>
              <CardDescription>
                Start fresh with your own workspace and invite your team
                whenever you&apos;re ready.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Link href="/app/new">Create workspace</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Waiting on an invite?</CardTitle>
              <CardDescription>
                Ask a workspace admin to invite{" "}
                <span className="font-medium text-foreground">
                  {sessionUser.email}
                </span>
                . You&apos;ll get an email with a link to join instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CopyEmailButton email={sessionUser.email ?? ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
