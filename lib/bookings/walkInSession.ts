import {
  deviceCharge,
  extraPlayersCharge,
  perExtraPlayerCharge,
  round2,
} from '@/lib/payments/money'

/**
 * Pricing for a walk-in session, from the time actually played.
 *
 * A fixed booking knows its price before anybody sits down: the duration was
 * chosen from a list of half-hour blocks and multiplied by the rate. A walk-in
 * session has no chosen duration at all - it is worth whatever the gap between
 * check-in and checkout turns out to be, so the arithmetic happens once, at
 * checkout, from two timestamps the database generated.
 *
 * The rate and the rounding are the existing ones: whole rupees for the station,
 * and each extra player's share rounded before they are added up. Only the
 * duration is new, and it is billed to the exact minute rather than rounded up to
 * the next half hour - 2h45m is charged as 2.75 hours.
 */

/** The station is held for this long from check-in while play is in progress. */
export const PROVISIONAL_SESSION_HOURS = 5

/** Nothing is ever billed as a zero-length session. */
export const MIN_BILLABLE_MINUTES = 1

export interface SessionWindow {
  startedAt: Date
  endedAt: Date
}

export interface SessionPricingInput {
  playedMinutes: number
  hourlyRate: number
  playerCount: number
  includedPlayers: number
  extraPlayerCharge: number
}

export interface SessionPricing {
  playedMinutes: number
  durationHours: number
  deviceCharges: number
  extraPlayersCount: number
  /** What one extra player cost for this session, so the receipt line multiplies. */
  perExtraPlayer: number
  extraPlayersTotal: number
  deviceSubtotal: number
}

/**
 * Whole minutes between the two ends of a session, rounded up.
 *
 * Rounded up so a customer who played for forty seconds is billed for a minute
 * rather than nothing, and clamped so a clock that goes backwards between the two
 * stamps cannot produce a negative bill.
 */
export function playedMinutes(window: SessionWindow): number {
  const ms = window.endedAt.getTime() - window.startedAt.getTime()
  if (!Number.isFinite(ms) || ms <= 0) return MIN_BILLABLE_MINUTES
  return Math.max(MIN_BILLABLE_MINUTES, Math.ceil(ms / 60000))
}

/**
 * What the session comes to.
 *
 * `durationHours` is kept unrounded for the arithmetic and only rounded to two
 * places for storage, so a 2h45m session prices off 2.75 exactly rather than off
 * whatever the stored column happened to keep.
 */
export function priceSession(input: SessionPricingInput): SessionPricing {
  const minutes = Math.max(MIN_BILLABLE_MINUTES, Math.trunc(input.playedMinutes) || 0)
  const hours = minutes / 60

  const extraPlayersCount = Math.max(0, input.playerCount - input.includedPlayers)
  const deviceCharges = deviceCharge(input.hourlyRate, hours)
  const perExtraPlayer = perExtraPlayerCharge(input.extraPlayerCharge, hours)
  const extraPlayersTotal = extraPlayersCharge(
    extraPlayersCount,
    input.extraPlayerCharge,
    hours
  )

  return {
    playedMinutes: minutes,
    durationHours: round2(hours),
    deviceCharges,
    extraPlayersCount,
    perExtraPlayer,
    extraPlayersTotal,
    deviceSubtotal: round2(deviceCharges + extraPlayersTotal),
  }
}

export interface SessionTimes {
  /** Formatted check-in time, or null while the customer is still expected. */
  checkedInAt: string | null
  /** Formatted checkout time, or null while play is in progress. */
  completedAt: string | null
}

/**
 * The times to show for a booking in a list.
 *
 * A fixed booking has a slot with both ends known from the moment it is taken, so
 * it reads as a range. A session does not: before check-in it has no times at all,
 * and while it is being played the only real time is when it started - the end
 * stored on its slot row is the provisional block held to keep the station busy,
 * and printing that as a range would tell staff the customer is leaving at a time
 * nobody has decided. Only after checkout is there a genuine second time to show.
 *
 * Returns null when the caller should fall back to the slot range it already has.
 */
export function sessionTimes(booking: {
  billed_on_actual_time?: boolean | null
  status?: string | null
  checked_in_at?: string | null
  completed_at?: string | null
}): SessionTimes | null {
  if (!booking.billed_on_actual_time) return null

  const at = (value: string) =>
    new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return {
    checkedInAt: booking.checked_in_at ? at(booking.checked_in_at) : null,
    completedAt: booking.completed_at ? at(booking.completed_at) : null,
  }
}

/** "2h 45m", or "45m" when it did not reach an hour. Used on the admin screens. */
export function formatPlayedDuration(minutes: number): string {
  const safe = Math.max(0, Math.trunc(minutes) || 0)
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

/**
 * The clock time of a `Date`, as Postgres stores it in `slot_start_time`.
 *
 * A session that runs past midnight keeps a start later than its end, which is
 * exactly the shape every availability check already unwraps.
 */
export function toClockTime(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}

/** The local calendar date of a `Date`, as Postgres stores it in `slot_date`. */
export function toSlotDate(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}
