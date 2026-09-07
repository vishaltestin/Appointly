import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { db } from "@/lib/db"
import { loginSchema } from "@/lib/validations/auth.schema"
import { bootstrapNewUserWorkspace } from "@/lib/workspace-bootstrap"

const hasGoogleCredentials = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
)

/**
 * Thrown when a credentials login matches a pending signup (account not yet
 * created) or a legacy user whose mobile never passed the WhatsApp OTP step.
 */
export class PhoneNotVerifiedError extends CredentialsSignin {
  code = "phone_not_verified"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Only used for OAuth account/user persistence. Credentials sign-in
  // bypasses the adapter entirely (see authorize() below) — this is the
  // officially supported "hybrid" pattern for Auth.js v5 with strategy: "jwt".
  adapter: PrismaAdapter(db),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      // Re-check suspension for OAuth sign-ins too (Credentials already
      // checks this inside authorize(), but OAuth skips authorize()).
      if (!user?.email) return true
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
        select: { status: true },
      })
      if (dbUser?.status === "SUSPENDED") return false
      return true
    },
  },
  events: {
    // Fires exactly once, the first time a user signs in via an OAuth
    // provider (i.e. right after the adapter creates their User row).
    // Mirrors what registerUser() does for credentials signups: join a
    // pending invitation if one exists for this email, otherwise bootstrap
    // a personal workspace.
    async createUser({ user }) {
      if (!user.id || !user.email) return
      await bootstrapNewUserWorkspace({
        userId: user.id,
        email: user.email,
        name: user.name ?? null,
      })
    },
  },
  providers: [
    // TODO(Module 10): Google Calendar two-way sync will request the
    // calendar.events scope on top of this once that module is built.
    ...(hasGoogleCredentials
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                // Forces Google's account chooser every time, instead of silently
                // reusing whichever Google session is already active in the browser.
                // Without this, "log out and sign in as someone else" appears broken.
                prompt: "select_account",
              },
            },
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await db.user.findUnique({ where: { email } })

        if (!user) {
          // No account yet — but they may have a pending signup that never
          // passed the WhatsApp OTP step. If the password matches that
          // pending signup, route them to verification instead of a plain
          // "invalid credentials".
          const pending = await db.pendingRegistration.findUnique({
            where: { email },
          })
          if (pending) {
            const matchesPending = await bcrypt.compare(
              password,
              pending.passwordHash
            )
            if (matchesPending) throw new PhoneNotVerifiedError()
          }
          return null
        }

        if (!user.password) return null
        if (user.status === "SUSPENDED") return null

        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (!passwordsMatch) return null

        // Signup requires WhatsApp OTP verification of the mobile number.
        // Accounts without a phone (Google signups, pre-OTP users, invited
        // members) are intentionally not gated.
        if (user.phone && !user.phoneVerifiedAt) throw new PhoneNotVerifiedError()

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          globalRole: user.globalRole,
        }
      },
    }),
  ],
})
