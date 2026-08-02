const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Access denied. Your account may be suspended, or this sign-in method isn't permitted for this email.",
  Configuration:
    "There's a server configuration issue. Please try again later.",
  Verification: "This verification link is invalid or has expired.",
  OAuthAccountNotLinked:
    "This email is already registered using a different sign-in method. Please sign in with your original method.",
  OAuthSignin: "We couldn't start the Google sign-in flow. Please try again.",
  OAuthCallback:
    "Something went wrong completing Google sign-in. Please try again.",
  CredentialsSignin: "Invalid email or password.",
  Default: "Something went wrong while signing you in. Please try again.",
}

export function getAuthErrorMessage(code?: string | null) {
  if (!code) return null
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default
}
