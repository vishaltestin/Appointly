"use server"

import { Prisma } from "@/generated/prisma/client"
import { addMinutes } from "date-fns"
import { db } from "@/lib/db"
import { getEventTypeSlots } from "@/lib/booking-engine"
import {
  sendBookingConfirmationEmail,
  sendBookingPendingApprovalEmail,
  sendHostApprovalRequiredEmail,
} from "@/lib/mail"
import { generateSecureToken } from "@/lib/tokens"
import {
  createBookingSchema,
  type CreateBookingInput,
} from "@/lib/validations/booking.schema"
import { onBookingCreated } from "@/lib/customer-counters"

export async function getPublicSlots(
  orgSlug: string,
  eventSlug: string,
  rangeStartISO: string,
  rangeEndISO: string
) {
  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
  })
  if (!organization || organization.status === "SUSPENDED")
    return { error: "Unavailable." }

  const eventType = await db.eventType.findUnique({
    where: {
      organizationId_slug: { organizationId: organization.id, slug: eventSlug },
    },
  })
  if (!eventType || !eventType.isActive) return { error: "Unavailable." }

  const result = await getEventTypeSlots({
    eventType,
    rangeStart: new Date(rangeStartISO),
    rangeEnd: new Date(rangeEndISO),
  })

  if ("error" in result) return result
  return {
    slots: result.slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
    timezone: result.timezone,
  }
}

export async function createPublicBooking(
  orgSlug: string,
  eventSlug: string,
  values: CreateBookingInput
) {
  const parsed = createBookingSchema.safeParse(values)
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid booking details.",
    }

  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
  })
  if (!organization || organization.status === "SUSPENDED") {
    return { error: "This booking page is currently unavailable." }
  }

  const eventType = await db.eventType.findUnique({
    where: {
      organizationId_slug: { organizationId: organization.id, slug: eventSlug },
    },
    include: { membership: { include: { user: true } }, questions: true },
  })

  if (
    !eventType ||
    !eventType.isActive ||
    eventType.id !== parsed.data.eventTypeId
  ) {
    return { error: "This event type is no longer available." }
  }
  if (eventType.membership.user.status === "SUSPENDED") {
    return { error: "This host is currently unavailable." }
  }

  for (const q of eventType.questions) {
    if (q.required) {
      const answer = parsed.data.responses?.[q.id]
      if (!answer || !answer.trim())
        return { error: `Please answer: ${q.label}` }
    }
  }

  const startTime = parsed.data.startTime
  const endTime = addMinutes(startTime, eventType.durationMinutes)

  const check = await getEventTypeSlots({
    eventType,
    rangeStart: startTime,
    rangeEnd: endTime,
  })
  if ("error" in check) return { error: check.error }
  const stillAvailable = check.slots.some(
    (s) => s.start.getTime() === startTime.getTime()
  )
  if (!stillAvailable) {
    return {
      error: "Sorry, this time slot was just booked. Please pick another time.",
      slotTaken: true,
    }
  }

  const manageToken = generateSecureToken()
  const status = eventType.requiresConfirmation ? "PENDING" : "CONFIRMED"

  try {
    const booking = await db.$transaction(
      async (tx) => {
        const conflict = await tx.booking.findFirst({
          where: {
            hostMembershipId: eventType.membershipId,
            status: { in: ["CONFIRMED", "PENDING"] },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        })
        if (conflict) throw new Error("SLOT_TAKEN")

        // Must use `tx`, not the global `db` handle — otherwise the customer
        // row commits even when the booking insert below rolls back.
        const customerId = await onBookingCreated(tx, {
          organizationId: organization.id,
          email: parsed.data.attendeeEmail,
          name: parsed.data.attendeeName,
          timezone: parsed.data.attendeeTimezone,
          bookingStartTime: startTime,
          bookingStatus: status,
        })

        return tx.booking.create({
          data: {
            organizationId: organization.id,
            eventTypeId: eventType.id,
            eventTitle: eventType.title,
            durationMinutes: eventType.durationMinutes,
            hostMembershipId: eventType.membershipId,
            hostName: eventType.membership.user.name ?? "Host",
            hostEmail: eventType.membership.user.email,
            hostTimezone: eventType.membership.user.timezone,
            attendeeName: parsed.data.attendeeName,
            attendeeEmail: parsed.data.attendeeEmail,
            attendeeTimezone: parsed.data.attendeeTimezone,
            attendeeNotes: parsed.data.attendeeNotes || null,
            responses: parsed.data.responses ?? {},
            startTime,
            endTime,
            status,
            manageToken,
            customerId,
          },
        })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    const hostName = eventType.membership.user.name ?? "Host"

    if (status === "PENDING") {
      await sendBookingPendingApprovalEmail({
        to: parsed.data.attendeeEmail,
        eventTitle: eventType.title,
        hostName,
        startTime,
        manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${manageToken}`,
      })
      await sendHostApprovalRequiredEmail({
        to: eventType.membership.user.email,
        eventTitle: eventType.title,
        attendeeName: parsed.data.attendeeName,
        startTime,
        reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/${orgSlug}/bookings?tab=pending`,
      })
    } else {
      await sendBookingConfirmationEmail({
        to: parsed.data.attendeeEmail,
        eventTitle: eventType.title,
        hostName,
        startTime,
        confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${orgSlug}/${eventSlug}/confirmation/${booking.id}`,
        manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage/${manageToken}`,
      })
    }

    return {
      success: true,
      bookingId: booking.id,
      requiresConfirmation: status === "PENDING",
    }
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return {
        error:
          "Sorry, this time slot was just booked. Please pick another time.",
        slotTaken: true,
      }
    }
    throw err
  }
}
