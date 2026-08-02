import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignOutButton } from "@/components/auth/sign-out-button"
import Link from "next/link"

export default async function OrgSuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>
}) {
  const { org } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Workspace suspended</CardTitle>
          <CardDescription>
            {org ? `The workspace "${org}"` : "This workspace"} has been
            suspended by the Appointly team. Contact support if you believe this
            is a mistake.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline">
            <Link href="/app">Switch workspace</Link>
          </Button>
          <SignOutButton variant="ghost" />
        </CardContent>
      </Card>
    </div>
  )
}
