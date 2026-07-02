import { addDays, addMinutes, format, isAfter, isBefore, isWithinInterval } from 'date-fns'

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

