import { redirect } from "next/navigation"

/**
 * Org root ("/app/acme-studio") has no page of its own — the dashboard is
 * the canonical landing view. Redirect so a trimmed URL never 404s.
 * Membership checks happen in the layout above, before this runs.
 */
export default async function OrgIndexPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  redirect(`/app/${orgSlug}/dashboard`)
}
