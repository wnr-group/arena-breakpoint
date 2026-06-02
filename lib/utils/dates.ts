import { addDays, addMinutes, format, isAfter, isBefore, isWithinInterval } from 'date-fns'

export function formatSlotTime(date: Date): string {
  return format(date, 'h:mm a')
}

export function formatBookingDate(date: Date): string {
  return format(date, 'MMM dd, yyyy')
}

export function isSlotAvailable(slotStart: Date, slotEnd: Date, bookings: any[]): boolean {
  return !bookings.some(booking => {
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
