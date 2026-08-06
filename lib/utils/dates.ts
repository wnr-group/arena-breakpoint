import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns'

/**
 * Rolling booking window: slots can only be booked from today through the next
 * six days (7 days inclusive). Calendars, availability lookups and server-side
 * validation all derive their bounds from here.
 */
export const BOOKING_WINDOW_DAYS = 7

export const BOOKING_WINDOW_ERROR = `Bookings are only open for the next ${BOOKING_WINDOW_DAYS} days.`

export interface BookingWindow {
  /** Today at 00:00 local time - the first bookable day. */
  start: Date
  /** Today + 6 days at 00:00 local time - the last bookable day. */
  end: Date
}

/** Midnight of the given date, in the local timezone. */
export function startOfLocalDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * The bookable date range. `addDays` rolls over month and year boundaries, so
 * Aug 29 yields Aug 29 - Sep 4 and Dec 29 yields Dec 29 - Jan 4.
 */
export function getBookingWindow(reference: Date = new Date()): BookingWindow {
  const start = startOfLocalDay(reference)
  return { start, end: addDays(start, BOOKING_WINDOW_DAYS - 1) }
}

/** True when `date` falls on one of the bookable days. */
export function isDateWithinBookingWindow(
  date: Date,
  window: BookingWindow = getBookingWindow()
): boolean {
  const day = startOfLocalDay(date)
  return day >= window.start && day <= window.end
}

/** True when both dates fall on the same local calendar day. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Milliseconds until the local day flips, plus a second of slack so a timer
 * scheduled with it never fires a hair before midnight. Used to roll the date
 * selector over for a page that is left open overnight.
 */
export function msUntilNextLocalMidnight(reference: Date = new Date()): number {
  const nextMidnight = addDays(startOfLocalDay(reference), 1)
  return nextMidnight.getTime() - reference.getTime() + 1000
}

/**
 * The bookable days as a list, today first - what the 7-day date selector
 * renders. Month and year rollovers are handled by `addDays`.
 */
export function getBookingWindowDates(reference: Date = new Date()): Date[] {
  const start = startOfLocalDay(reference)
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, index) => addDays(start, index))
}

/** Parses a YYYY-MM-DD string as a local calendar date, or null if invalid. */
export function parseLocalDate(dateString: string): Date | null {
  const match =
    typeof dateString === 'string' ? dateString.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/) : null
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  // Rejects impossible dates that JS would roll over (e.g. 2026-02-31).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return date
}

/**
 * Server-side guard for a YYYY-MM-DD booking date.
 *
 * `toleranceDays` absorbs the offset between the browser's calendar day and the
 * server's: a request sent at 01:00 IST reaches a UTC server that is still on
 * the previous day, so the legitimate 7th day would otherwise be rejected.
 */
export function isBookingDateStringWithinWindow(
  dateString: string,
  toleranceDays = 1
): boolean {
  const date = parseLocalDate(dateString)
  if (!date) return false

  const offset = differenceInCalendarDays(date, new Date())
  return offset >= -toleranceDays && offset <= BOOKING_WINDOW_DAYS - 1 + toleranceDays
}

export function formatSlotTime(date: Date): string {
  return format(date, 'h:mm a')
}

export function formatBookingDate(date: Date): string {
  return format(date, 'MMM dd, yyyy')
}

export function isSlotAvailable(slotStart: Date, slotEnd: Date, bookings: any[]): boolean {
  return !bookings.some((booking) => {
    const bookingStart = new Date(booking.slot_start)
    const bookingEnd = new Date(booking.slot_end)
    return (
      isWithinInterval(slotStart, { start: bookingStart, end: bookingEnd }) ||
      isWithinInterval(slotEnd, { start: bookingStart, end: bookingEnd }) ||
      (isBefore(slotStart, bookingStart) && isAfter(slotEnd, bookingEnd))
    )
  })
}

export function addSlotLockMinutes(minutes: number): Date {
  return addMinutes(new Date(), minutes)
}

export function getAdvanceBookingDate(days: number): Date {
  return addDays(new Date(), days)
}

export function isWithinGracePeriod(slotStart: Date, graceMinutes: number): boolean {
  const now = new Date()
  const gracePeriodEnd = addMinutes(slotStart, graceMinutes)
  return isAfter(now, slotStart) && isBefore(now, gracePeriodEnd)
}

/**
 * Converts DD-MM-YYYY format to YYYY-MM-DD format for database storage
 * @param dateStr - Date string in DD-MM-YYYY format
 * @returns Date string in YYYY-MM-DD format, or empty string if invalid
 */
export function formatDateForDB(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts;

  // Validate all parts exist and are numeric
  if (!day || !month || !year) return '';
  if (!/^\d+$/.test(day) || !/^\d+$/.test(month) || !/^\d+$/.test(year)) return '';

  // Validate ranges
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (d < 1 || d > 31) return '';
  if (m < 1 || m > 12) return '';
  if (y < 1900 || y > new Date().getFullYear()) return '';

  // Pad with zeros if needed
  const paddedDay = day.padStart(2, '0');
  const paddedMonth = month.padStart(2, '0');

  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Converts YYYY-MM-DD format to DD-MM-YYYY format for display
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date string in DD-MM-YYYY format, or empty string if invalid
 */
export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return '';

  const [year, month, day] = parts;

  // Validate all parts exist
  if (!year || !month || !day) return '';

  return `${day}-${month}-${year}`;
}

/**
 * Validates a date string in DD-MM-YYYY format
 * @param dateStr - Date string in DD-MM-YYYY format
 * @returns true if valid, false otherwise
 */
export function isValidDateDDMMYYYY(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;

  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return false;

  const [day, month, year] = parts;

  // Check if all parts are numeric
  if (!/^\d+$/.test(day) || !/^\d+$/.test(month) || !/^\d+$/.test(year)) return false;

  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  // Basic range validation
  if (d < 1 || d > 31) return false;
  if (m < 1 || m > 12) return false;
  if (y < 1900 || y > new Date().getFullYear()) return false;

  // Check if date is valid (e.g., not Feb 30)
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Validates if person is of legal age (18+)
 * @param dateStr - Date string in DD-MM-YYYY format
 * @returns true if 18 or older, false otherwise
 */
export function isLegalAge(dateStr: string): boolean {
  if (!isValidDateDDMMYYYY(dateStr)) return false;

  const [day, month, year] = dateStr.split('-').map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 18;
}

/**
 * Handles DOB input with auto-formatting (DD-MM-YYYY)
 * @param value - Input value
 * @returns Formatted date string
 */
export function handleDobInput(value: string): string {
  // Remove non-numeric characters
  const numbers = value.replace(/\D/g, "");

  // Format as DD-MM-YYYY
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4, 8)}`;
  }
}

/**
 * Safely converts a Date object to local YYYY-MM-DD string without timezone shifting
 */
export function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

