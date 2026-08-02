import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
)

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string
    token?: string
    callbackUrl?: string
  }>
}) {
  const { email, token, callbackUrl } = await searchParams
  const resolvedCallback =
    callbackUrl ?? (token ? `/invite/${token}` : undefined)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start scheduling in under 2 minutes
        </p>
      </div>
      <RegisterForm
        defaultEmail={email}
        invitationToken={token}
        callbackUrl={resolvedCallback}
        googleEnabled={googleEnabled}
      />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
