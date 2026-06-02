// Time slot utilities for flexible booking system

export const BUSINESS_START_HOUR = 10; // 10 AM
export const BUSINESS_END_HOUR = 23; // 11 PM
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_HOURS = 5;

/**
 * Generate all possible start times in 30-minute intervals
 * From 10:00 AM to 11:00 PM
 */
export function generateStartTimes(): string[] {
  const times: string[] = [];

  for (let hour = BUSINESS_START_HOUR; hour <= BUSINESS_END_HOUR; hour++) {
    for (let minute of [0, 30]) {
      // Don't include times that would go past 11 PM for minimum 30-min booking
      if (hour === BUSINESS_END_HOUR && minute === 30) continue;

      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(formatTo12Hour(time24));
    }
  }

  return times;
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
 */
export function calculateEndTime(startTime12: string, durationMinutes: number): string {
  const startTime24 = formatTo24Hour(startTime12);
  const [hours, minutes] = startTime24.split(':').map(Number);

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  const endTime24 = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  return formatTo12Hour(endTime24);
}

/**
 * Check if a time range is within business hours
 */
export function isWithinBusinessHours(startTime12: string, endTime12: string): boolean {
  const startTime24 = formatTo24Hour(startTime12);
  const endTime24 = formatTo24Hour(endTime12);

  const [startHour] = startTime24.split(':').map(Number);
  const [endHour, endMinute] = endTime24.split(':').map(Number);

  const businessEnd = BUSINESS_END_HOUR * 60; // 11 PM in minutes
  const endTimeMinutes = endHour * 60 + endMinute;

  return startHour >= BUSINESS_START_HOUR && endTimeMinutes <= businessEnd;
}

/**
 * Get maximum available duration for a given start time
 */
export function getMaxDurationForStartTime(startTime12: string): number {
  const startTime24 = formatTo24Hour(startTime12);
  const [startHour, startMinute] = startTime24.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const businessEndMinutes = BUSINESS_END_HOUR * 60; // 11 PM
  const maxMinutes = businessEndMinutes - startMinutes;

  // Cap at MAX_DURATION_HOURS
  return Math.min(maxMinutes, MAX_DURATION_HOURS * 60);
}

/**
 * Calculate price based on hourly rate and duration
 */
export function calculatePrice(hourlyRate: number, durationMinutes: number): number {
  const hours = durationMinutes / 60;
  return Math.round(hourlyRate * hours);
}
