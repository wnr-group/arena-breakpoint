// Time slot utilities for flexible booking system (24-hour operation)

export const BUSINESS_START_HOUR = 0; // 12:00 AM (Midnight)
export const BUSINESS_END_HOUR = 23; // 11:59 PM
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_HOURS = 5;

/**
 * Generate all possible start times in 30-minute intervals
 * 24-hour operation (12:00 AM to 11:30 PM)
 */
export function generateStartTimes(): string[] {
  const times: string[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(formatTo12Hour(time24));
    }
  }

  return times;
}

/**
 * Filter start times to only show future slots for today
 * If selected date is today, remove past time slots
 */
export function filterPastTimeSlots(allTimes: string[], selectedDate: Date): string[] {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  if (!isToday) {
    // Future date - all times are available
    return allTimes;
  }

  // Today - filter out past times
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return allTimes.filter(time12 => {
    const time24 = formatTo24Hour(time12);
    const [hour, minute] = time24.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;

    // Only include times that are at least 30 minutes in the future
    return timeMinutes > currentMinutes + 30;
  });
}

/**
 * Generate duration options (30 min to 5 hours in 30-min increments)
 */
export function generateDurationOptions(): { label: string; value: number; hours: number }[] {
  const options: { label: string; value: number; hours: number }[] = [];

  // 30 min to 5 hours (10 slots)
  for (let halfHours = 1; halfHours <= MAX_DURATION_HOURS * 2; halfHours++) {
    const minutes = halfHours * 30;
    const hours = halfHours / 2;

    let label: string;
    if (halfHours === 1) {
      label = "30 minutes";
    } else if (halfHours % 2 === 0) {
      label = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const wholeHours = Math.floor(hours);
      label = `${wholeHours}.5 hours`;
    }

    options.push({ label, value: minutes, hours });
  }

  return options;
}

/**
 * Convert 24-hour time to 12-hour format
 */
export function formatTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Convert 12-hour time to 24-hour format
 */
export function formatTo24Hour(time12: string): string {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '00:00';

  let [, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Calculate end time given start time and duration in minutes
 * Handles overnight bookings (e.g., 11:00 PM + 2 hours = 01:00 AM next day)
 */
export function calculateEndTime(startTime12: string, durationMinutes: number): string {
  const startTime24 = formatTo24Hour(startTime12);
  const [hours, minutes] = startTime24.split(':').map(Number);

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24; // Wrap around 24 hours
  const endMinutes = totalMinutes % 60;

  const endTime24 = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  return formatTo12Hour(endTime24);
}

/**
 * Check if a time range is within business hours (24-hour operation - always true)
 */
export function isWithinBusinessHours(startTime12: string, endTime12: string): boolean {
  // For 24-hour operation, we just need to ensure the booking doesn't exceed 5 hours
  const startTime24 = formatTo24Hour(startTime12);
  const endTime24 = formatTo24Hour(endTime12);

  const [startHour, startMinute] = startTime24.split(':').map(Number);
  const [endHour, endMinute] = endTime24.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;

  // Handle overnight bookings (e.g., 11 PM to 2 AM)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }

  const duration = endMinutes - startMinutes;
  return duration <= MAX_DURATION_HOURS * 60; // Max 5 hours
}

/**
 * Get maximum available duration for a given start time
 * For 24-hour operation, always return max duration (5 hours)
 */
export function getMaxDurationForStartTime(startTime12: string): number {
  // For 24-hour operation, maximum duration is always 5 hours
  return MAX_DURATION_HOURS * 60; // 300 minutes
}

/**
 * Calculate price based on hourly rate and duration
 */
export function calculatePrice(hourlyRate: number, durationMinutes: number): number {
  const hours = durationMinutes / 60;
  return Math.round(hourlyRate * hours);
}
