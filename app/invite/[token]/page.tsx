import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { acceptInvitation } from "@/actions/member.actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { AuthDivider } from "@/components/auth/auth-divider"

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
)

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth()

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: true, invitedBy: true },
  })

  if (!invitation) {
    return (
      <InviteMessage
        title="Invitation not found"
        description="This invite link is invalid."
      />
    )
  }

  const sessionEmailMatches =
    session?.user?.email?.toLowerCase() === invitation.email.toLowerCase()

  if (invitation.status === "ACCEPTED") {
    // Most likely they already joined (possibly via Google auto-join) —
    // send them straight in instead of showing a dead-end message.
    if (sessionEmailMatches)
      redirect(`/app/${invitation.organization.slug}/dashboard`)
    return (
      <InviteMessage
        title="Already accepted"
        description="This invitation has already been used."
      />
    )
  }
  if (invitation.status === "REVOKED") {
    return (
      <InviteMessage
        title="Invitation revoked"
        description="This invitation is no longer valid."
      />
    )
  }
  if (invitation.expiresAt < new Date()) {
    return (
      <InviteMessage
        title="Invitation expired"
        description="Ask for a new invitation link."
      />
    )
  }

  // Already logged in as the invited user → accept immediately.
  if (sessionEmailMatches) {
    await acceptInvitation(token)
  }

  const callbackUrl = `/invite/${token}`

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invitation.organization.name}</CardTitle>
          <CardDescription>
            {invitation.invitedBy.name} invited you ({invitation.email}) to
            collaborate as{" "}
            <span className="font-medium">{invitation.role.toLowerCase()}</span>{" "}
            on Appointly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {session?.user && (
            <p className="text-sm text-destructive">
              You&apos;re signed in as {session.user.email}, but this invite was
              sent to {invitation.email}. Please sign in with the correct
              account.
            </p>
          )}

          {googleEnabled && (
            <>
              <GoogleAuthButton callbackUrl={callbackUrl} />
              <AuthDivider />
            </>
          )}

          <Button>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              Sign in to accept
            </Link>
          </Button>
          <Button variant="outline">
            <Link
              href={`/register?email=${encodeURIComponent(invitation.email)}&token=${token}`}
            >
              Create an account
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function InviteMessage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            <Link href="/app">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
