import crypto from "crypto"

/**
 * Used for booking manage-links. Deliberately NOT cuid()/uuid() — those are
 * predictable enough in structure that a booking ID shouldn't double as an
 * authorization token. This is the actual authorization boundary for the
 * public "manage booking" page, so it needs to be cryptographically random.
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex")
}
