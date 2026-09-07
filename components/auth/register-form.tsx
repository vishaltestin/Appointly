"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth.schema"
import { registerUser } from "@/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { AuthDivider } from "@/components/auth/auth-divider"
import { PhoneOtpCard } from "@/components/auth/phone-otp-card"

interface RegisterFormProps {
  defaultEmail?: string
  invitationToken?: string
  callbackUrl?: string
  googleEnabled?: boolean
}

export function RegisterForm({
  defaultEmail,
  invitationToken,
  callbackUrl,
  googleEnabled,
}: RegisterFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [invalidInvite, setInvalidInvite] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [otpState, setOtpState] = useState<{
    email: string
    maskedPhone: string
    devOtp?: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: defaultEmail },
  })

  function onSubmit(values: RegisterInput) {
    setError(null)
    setInvalidInvite(false)
    setSuccess(null)
    startTransition(async () => {
      const res = await registerUser(values, invitationToken)
      if ("error" in res && res.error) {
        // A code was sent moments ago — skip resending and go straight to
        // the OTP step (resend is available there after the cooldown).
        if (res.otpPending) {
          setOtpState({
            email: res.otpPending.email,
            maskedPhone: res.otpPending.maskedPhone,
          })
          return
        }
        setError(res.error)
        setInvalidInvite(Boolean(res.invalidInvite))
        return
      }
      if ("otpRequired" in res && res.otpRequired) {
        setOtpState({
          email: res.email,
          maskedPhone: res.maskedPhone,
          devOtp: res.devOtp,
        })
      }
    })
  }

  function onVerified() {
    setSuccess("Mobile verified — your account is ready.")
    const loginUrl = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login"
    setTimeout(() => router.push(loginUrl), 1200)
  }

  if (otpState) {
    return (
      <div className="space-y-4">
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {!success && (
          <PhoneOtpCard
            email={otpState.email}
            maskedPhone={otpState.maskedPhone}
            initialDevOtp={otpState.devOtp}
            onVerified={onVerified}
            onBack={() => setOtpState(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <GoogleAuthButton callbackUrl={callbackUrl ?? "/app"} />
          <AuthDivider />
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              {invalidInvite && (
                <>
                  {" "}
                  <Link href="/register" className="font-medium underline">
                    Continue without invite
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jane Doe" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number (WhatsApp)</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            We&apos;ll send a one-time verification code to this number.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
          {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </div>
  )
}
