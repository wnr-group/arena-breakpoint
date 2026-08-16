import { arenaClockTime, arenaToday } from '@/lib/utils/dates'
import { MAX_LIVE_SESSION_HOURS } from '@/lib/bookings/walkInSession'

/**
 * Bookings that stopped part-way through and need somebody to finish them.
 *
 * The arena's booking flow assumes each row walks from `confirmed` to
 * `checked_in` to `completed`, with the money collected somewhere along the way.
 * Rows that fall out of that sequence do not error and do not disappear - they
 * just sit in the list looking like every other booking. Production is currently
 * holding eighteen sessions checked in and never checked out, the oldest fifty-one
 * days old, which nothing on any screen was saying out loud.
 *
 * These are reported, never auto-corrected. A session left open might be a
 * forgotten checkout or might be a customer who walked out without paying, and
 * those want different responses from whoever is at the counter.
 */

export type BookingAttentionKind = 'never_checked_out' | 'no_show' | 'unpaid'

export type BookingAttention = {
  kind: BookingAttentionKind
  /** Short enough for a badge. */
  label: string
  /** One line explaining what happened, for a tooltip or the detail view. */
  detail: string
  severity: 'high' | 'medium'
}

type AttentionInput = {
  status?: string | null
  payment_status?: string | null
  checked_in_at?: string | null
  completed_at?: string | null
  total_amount?: number | string | null
  amount_paid?: number | string | null
  booking_device_slots?: Array<{
    slot_date?: string | null
    slot_start_time?: string | null
    slot_end_time?: string | null
  }> | null
}

const HOURS = 60 * 60 * 1000

/** `HH:MM:SS`, dropping any fractional seconds Postgres hands back. */
function clockOnly(time: string): string {
  return time.slice(0, 8)
}

/**
 * When a slot finishes, as `YYYY-MM-DD HH:MM:SS` on the arena's clock.
 *
 * A session booked across midnight ends on the following date - the end time
 * being earlier than the start is exactly how those rows are stored, and
 * comparing the two directly would place the end nearly a full day too early.
 */
function slotEndsAt(slot: {
  slot_date?: string | null
  slot_start_time?: string | null
  slot_end_time?: string | null
}): string | null {
  if (!slot.slot_date || !slot.slot_end_time) return null

  const end = clockOnly(slot.slot_end_time)
  const start = slot.slot_start_time ? clockOnly(slot.slot_start_time) : null

  let date = slot.slot_date
  if (start && end < start) {
    const next = new Date(`${slot.slot_date}T00:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 1)
    date = next.toISOString().slice(0, 10)
  }

  return `${date} ${end}`
}

function toAmount(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Everything wrong with a booking, worst first.
 *
 * `now` is injectable so this can be tested at a fixed instant rather than
 * whenever the suite happens to run.
 */
export function bookingAttention(
  booking: AttentionInput,
  now: Date = new Date()
): BookingAttention[] {
  const flags: BookingAttention[] = []
  const status = String(booking.status ?? '').toLowerCase()

  if (status === 'cancelled') return flags

  const total = toAmount(booking.total_amount)
  const paid = toAmount(booking.amount_paid)
  const balance = total - paid

  // 1. Checked in and never checked out.
  if (status === 'checked_in' && booking.checked_in_at) {
    const openFor = now.getTime() - new Date(booking.checked_in_at).getTime()
    if (openFor > MAX_LIVE_SESSION_HOURS * HOURS) {
      const days = Math.floor(openFor / (24 * HOURS))
      const hours = Math.floor(openFor / HOURS)
      flags.push({
        kind: 'never_checked_out',
        label: 'Never checked out',
        detail:
          days >= 1
            ? `Checked in ${days} day${days > 1 ? 's' : ''} ago and still open. The station reads as free; close the session to bill it.`
            : `Checked in ${hours} hours ago and still open. Close the session to bill it.`,
        severity: 'high',
      })
    }
  }

  // 2. Confirmed, slot finished, nobody ever arrived.
  if (status === 'confirmed') {
    const nowStamp = `${arenaToday(now)} ${arenaClockTime(now)}`
    const ends = (booking.booking_device_slots || [])
      .map(slotEndsAt)
      .filter((value): value is string => value !== null)

    // The last slot to finish is the one that decides whether the whole booking
    // has been missed; an early slot ending is not a no-show on its own.
    const lastEnd = ends.sort().at(-1)

    if (lastEnd && lastEnd < nowStamp) {
      flags.push({
        kind: 'no_show',
        label: 'Never checked in',
        detail: 'The slot has finished and this booking was never checked in. Mark it as a no-show or cancel it.',
      severity: 'medium',
      })
    }
  }

  // 3. The station was used and there is still money owed.
  //
  // Skips a walk-in mid-session on purpose: its total is zero until checkout
  // prices it, so every live walk-in would otherwise read as unpaid.
  if ((status === 'checked_in' || status === 'completed') && total > 0 && balance > 0) {
    flags.push({
      kind: 'unpaid',
      label: status === 'completed' ? 'Left unpaid' : 'Payment due',
      detail:
        status === 'completed'
          ? `This session is closed with ₹${balance.toFixed(2)} still outstanding.`
          : `₹${balance.toFixed(2)} outstanding on a session still in progress.`,
      severity: status === 'completed' ? 'high' : 'medium',
    })
  }

  return flags.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'high' ? -1 : 1))
}

/** True when anything on the booking wants a member of staff to look at it. */
export function needsAttention(booking: AttentionInput, now?: Date): boolean {
  return bookingAttention(booking, now).length > 0
}
