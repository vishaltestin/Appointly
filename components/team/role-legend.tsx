import { Crown, ShieldCheck, UserRound } from "lucide-react"

/**
 * In-product explainer for the three workspace roles. The copy mirrors
 * lib/permissions.ts exactly — if a permission changes there, update the
 * bullets here too.
 */
const ROLES = [
  {
    icon: Crown,
    name: "Owner",
    tagline: "Full control",
    points: [
      "Everything an admin can do",
      "Plan, billing & workspace deletion",
      "Assigns admin & member roles",
    ],
  },
  {
    icon: ShieldCheck,
    name: "Admin",
    tagline: "Runs the workspace",
    points: [
      "Sees & manages everyone's bookings",
      "Invites and removes members",
      "Edits workspace settings",
    ],
  },
  {
    icon: UserRound,
    name: "Member",
    tagline: "Runs their own calendar",
    points: [
      "Own event types & availability",
      "Sees only their own bookings",
      "No access to workspace settings",
    ],
  },
]

export function RoleLegend() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ROLES.map((role) => (
        <div
          key={role.name}
          className="rounded-xl border bg-card p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <role.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">{role.name}</p>
              <p className="text-xs text-muted-foreground">{role.tagline}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {role.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
