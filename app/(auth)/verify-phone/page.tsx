import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { maskPhone } from "@/lib/phone"
import { PhoneOtpClient } from "@/components/auth/phone-otp-client"

/**
 * Standalone phone-verification page. Users land here from the sign-in
 * error path ("verify your mobile first") when they registered but never
 * completed the WhatsApp OTP step.
 */
export default async function VerifyPhonePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email: rawEmail } = await searchParams
  const email = rawEmail?.trim().toLowerCase()
  if (!email) redirect("/login")

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, phone: true, phoneVerifiedAt: true },
  })
  if (!user || !user.phone) redirect("/login")

  return (
    <div className="space-y-6">
      {user.phoneVerifiedAt ? (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Already verified
          </h1>
          <p className="text-sm text-muted-foreground">
            This mobile number is already verified — you can sign in.
          </p>
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <PhoneOtpClient email={email} maskedPhone={maskPhone(user.phone)} />
      )}
    </div>
  )
}
