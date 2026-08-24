import Link from "next/link"
import { Button } from "@/components/ui/button"

/**
 * Button styled as a Next.js Link. `nativeButton={false}` is required on
 * base-ui's Button when `render` is not a real <button> — without it the
 * console fills with accessibility warnings.
 */
export function LinkButton({
  href,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "render"> & {
  href: string
  children: React.ReactNode
}) {
  return (
    <Button nativeButton={false} render={<Link href={href} />} {...props}>
      {children}
    </Button>
  )
}
