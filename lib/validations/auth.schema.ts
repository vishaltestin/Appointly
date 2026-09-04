import { z } from "zod"
import { normalizePhone } from "@/lib/phone"

export const loginSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .min(8, "Enter your mobile number")
      .refine((v) => normalizePhone(v) !== null, {
        message: "Enter a valid mobile number with country code (e.g. +91 98765 43210)",
      }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const verifyPhoneOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>
