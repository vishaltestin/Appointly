import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { AuthErrorAlert } from "@/components/auth/auth-error-alert"

// Google sign-in is commented out for the time being (round 7 request).
// To re-enable: flip this to `true` and set GOOGLE_CLIENT_ID /
// GOOGLE_CLIENT_SECRET. The OAuth provider config in auth.ts is untouched.
const GOOGLE_SIGN_IN_ENABLED = false

const googleEnabled =
  GOOGLE_SIGN_IN_ENABLED &&
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const { callbackUrl, error } = await searchParams

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Appointly account
        </p>
      </div>
      <AuthErrorAlert code={error} />
      <LoginForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
