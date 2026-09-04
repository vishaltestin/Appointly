"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PhoneOtpCard } from "@/components/auth/phone-otp-card"

/** Client wrapper for the /verify-phone page (uses the shared OTP card). */
export function PhoneOtpClient({
  email,
  maskedPhone,
}: {
  email: string
  maskedPhone: string
}) {
  const router = useRouter()
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Mobile number verified — you can sign in now.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PhoneOtpCard
        email={email}
        maskedPhone={maskedPhone}
        onVerified={() => {
          setDone(true)
          setTimeout(() => router.push("/login"), 1200)
        }}
      />
      <p className="text-center text-sm text-muted-foreground">
        Wrong account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
