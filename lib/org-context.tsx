"use client"

import { createContext, useContext } from "react"
import type { OrgRole } from "@/generated/prisma/client"

interface OrgContextValue {
  organization: {
    id: string
    name: string
    slug: string
    logo: string | null
    timezone: string
  }
  role: OrgRole
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({
  value,
  children,
}: {
  value: OrgContextValue
  children: React.ReactNode
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error("useOrg must be used within an OrgProvider")
  return ctx
}
