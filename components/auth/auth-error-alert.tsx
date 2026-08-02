import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuthErrorMessage } from "@/lib/auth-errors"

export function AuthErrorAlert({ code }: { code?: string | null }) {
  const message = getAuthErrorMessage(code)
  if (!message) return null

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
