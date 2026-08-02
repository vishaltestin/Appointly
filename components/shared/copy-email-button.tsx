"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        navigator.clipboard.writeText(email)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      {copied ? "Copied!" : "Copy my email"}
    </Button>
  )
}
