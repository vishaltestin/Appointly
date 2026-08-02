import type { NextAuthConfig } from "next-auth"

const PROTECTED_PREFIXES = ["/app", "/admin"]
const AUTH_PAGES = ["/login", "/register", "/forgot-password"]

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const path = nextUrl.pathname

      const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p))
      const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p))

      if (path.startsWith("/admin")) {
        if (!isLoggedIn) return false
        const role = (auth?.user as { globalRole?: string })?.globalRole
        if (role !== "SUPER_ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }

      if (isProtected) return isLoggedIn

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.globalRole = (user as { globalRole?: string }).globalRole
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { globalRole?: string }).globalRole =
          token.globalRole as string
      }
      return session
    },
  },
  providers: [], // populated in auth.ts
} satisfies NextAuthConfig
