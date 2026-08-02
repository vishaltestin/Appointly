interface GenerateICSParams {
  uid: string
  title: string
  description?: string
  location?: string
  start: Date
  end: Date
  organizerEmail: string
  attendeeEmail: string
}

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function escapeText(text: string) {
  return text.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n")
}

/** Minimal, dependency-free RFC 5545 generator — good enough for a single VEVENT. */
export function generateICS({
  uid,
  title,
  description,
  location,
  start,
  end,
  organizerEmail,
  attendeeEmail,
}: GenerateICSParams) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Appointly//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@appointly`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeText(title)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : "",
    location ? `LOCATION:${escapeText(location)}` : "",
    `ORGANIZER:mailto:${organizerEmail}`,
    `ATTENDEE:mailto:${attendeeEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)

  return lines.join("\r\n")
}
