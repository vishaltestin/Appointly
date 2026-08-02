import { addMinutes, isBefore, isAfter } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export interface WorkingHoursInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface DateOverrideInput {
  date: Date;
  type: "UNAVAILABLE" | "CUSTOM_HOURS";
  startTime?: string | null;
  endTime?: string | null;
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface GetAvailableSlotsParams {
  timezone: string;
  workingHours: WorkingHoursInput[];
  dateOverrides: DateOverrideInput[];
  durationMinutes: number;
  rangeStart: Date;
  rangeEnd: Date;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  /** Already-booked ranges in real UTC time. Empty until Module 5/6 wires bookings in. */
  busy?: BusyInterval[];
  slotIntervalMinutes?: number;
  minimumNoticeMinutes?: number;
}

export const DEFAULT_WORKING_HOURS: WorkingHoursInput[] = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
}));

/**
 * Computes real, bookable UTC time slots from weekly working hours, date
 * overrides, and buffers.
 *
 * Correctness note: `toZonedTime(date, tz)` returns a Date object whose
 * **UTC** field getters represent the wall-clock time in `tz` — NOT its
 * local getters, which would reflect the server process's own timezone.
 * We therefore deliberately use getUTC setUTC* helpers everywhere below
 * instead of date-fns's default local-time helpers (getDay, addDays, etc.),
 * so this produces identical, correct results whether the server runs in
 * UTC, IST, or anywhere else.
 */
export function getAvailableSlots({
  timezone,
  workingHours,
  dateOverrides,
  durationMinutes,
  rangeStart,
  rangeEnd,
  bufferBeforeMinutes = 0,
  bufferAfterMinutes = 0,
  busy = [],
  slotIntervalMinutes,
  minimumNoticeMinutes = 0,
}: GetAvailableSlotsParams): TimeSlot[] {
  const step = slotIntervalMinutes ?? durationMinutes;
  const slots: TimeSlot[] = [];
  const earliestAllowed = addMinutes(new Date(), minimumNoticeMinutes);

  const overridesByDate = new Map(
    dateOverrides.map((o) => [zonedDateKey(toZonedTime(o.date, timezone)), o])
  );

  let cursor = toZonedTime(rangeStart, timezone);
  const endCursor = toZonedTime(rangeEnd, timezone);

  while (!isAfter(startOfUtcDay(cursor), startOfUtcDay(endCursor))) {
    const dateKey = zonedDateKey(cursor);
    const override = overridesByDate.get(dateKey);

    let dayRanges: { startTime: string; endTime: string }[] = [];

    if (override) {
      if (override.type === "CUSTOM_HOURS" && override.startTime && override.endTime) {
        dayRanges = [{ startTime: override.startTime, endTime: override.endTime }];
      }
      // UNAVAILABLE -> dayRanges stays empty, day is fully blocked
    } else {
      const dow = zonedDayOfWeek(cursor);
      dayRanges = workingHours.filter((wh) => wh.dayOfWeek === dow);
    }

    for (const range of dayRanges) {
      const rangeStartUtc = fromZonedTime(`${dateKey}T${range.startTime}:00`, timezone);
      const rangeEndUtc = fromZonedTime(`${dateKey}T${range.endTime}:00`, timezone);

      let slotStart = rangeStartUtc;
      while (!isAfter(addMinutes(slotStart, durationMinutes), rangeEndUtc)) {
        const slotEnd = addMinutes(slotStart, durationMinutes);

        const withinOverallRange = !isBefore(slotStart, rangeStart) && !isAfter(slotEnd, rangeEnd);
        const meetsNotice = !isBefore(slotStart, earliestAllowed);
        const isFree = !busy.some(
          (b) =>
            isBefore(addMinutes(slotStart, -bufferBeforeMinutes), b.end) &&
            isAfter(addMinutes(slotEnd, bufferAfterMinutes), b.start)
        );

        if (withinOverallRange && meetsNotice && isFree) {
          slots.push({ start: slotStart, end: slotEnd });
        }

        slotStart = addMinutes(slotStart, step);
      }
    }

    cursor = addZonedDays(cursor, 1);
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function zonedDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function zonedDayOfWeek(date: Date): number {
  return date.getUTCDay();
}

function addZonedDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function startOfUtcDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

/** Generates "HH:mm" -> "9:00 AM" style options for time dropdowns. */
export function generateTimeOptions(stepMinutes = 15): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const value = `${String(hours24).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    options.push({ value, label: formatTimeLabel(value) });
  }
  return options;
}

export function formatTimeLabel(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}