/**
 * Recharts styling helpers.
 *
 * Recharts takes colors as raw SVG/CSS values, not Tailwind classes, so the
 * theme tokens have to be referenced by hand. Two rules matter here:
 *
 * 1. `globals.css` defines tokens as **complete color values**
 *    (`--primary: oklch(0.205 0 0)`), not bare channels. So they must be
 *    used as `var(--primary)` — NOT `hsl(var(--primary))`, which expands to
 *    `hsl(oklch(...))` and is invalid CSS. That bug silently un-styled every
 *    chart in both light and dark mode.
 *
 * 2. Because the tokens are plain `var()` references resolved by the browser
 *    at paint time, charts follow the `.dark` class automatically — no theme
 *    detection, no re-render on toggle, no hydration mismatch.
 */

export const CHART_COLORS = {
  primary: "var(--primary)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  border: "var(--border)",
} as const

/** Shared Recharts <Tooltip contentStyle> so every chart matches the popover. */
export const chartTooltipStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid var(--border)",
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: "13px",
}

/** Shared Recharts axis tick styling — inherits the muted foreground token. */
export const chartAxisTick = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const

/**
 * A translucent shade of the primary token.
 *
 * `color-mix` is used instead of the `oklch(from ...)` relative syntax or a
 * bare `/ alpha` suffix because those don't work when the base color arrives
 * through a `var()` indirection.
 */
export function primaryWithOpacity(opacity: number): string {
  const percent = Math.round(Math.min(Math.max(opacity, 0), 1) * 100)
  return `color-mix(in oklch, var(--primary) ${percent}%, transparent)`
}
