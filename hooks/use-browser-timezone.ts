"use client"

import { useState, useSyncExternalStore } from "react"

/** The browser's IANA timezone, or "UTC" during server render. */
function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}

// The browser timezone never changes during a session, so the store never
// notifies. Both callbacks are module-level constants to keep the snapshot
// referentially stable across renders.
const subscribe = () => () => {}
const getServerSnapshot = () => "UTC"

/**
 * Reads the visitor's timezone and lets them override it.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: reading a
 * browser API is exactly the "external store" case it exists for. The old
 * effect-based version tripped `react-hooks/set-state-in-effect` and caused
 * an extra render pass — every slot list rendered once in UTC before
 * snapping to the real timezone.
 *
 * Returns a tuple matching `useState`, so callers read the same as before.
 */
export function useBrowserTimezone(): [string, (tz: string) => void] {
  const detected = useSyncExternalStore(
    subscribe,
    getBrowserTimezone,
    getServerSnapshot
  )
  const [override, setOverride] = useState<string | null>(null)

  return [override ?? detected, setOverride]
}
