"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AddToCalendarButton({
  icsContent,
  filename,
}: {
  icsContent: string
  filename: string
}) {
  function handleDownload() {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      Add to calendar
    </Button>
  )
}
