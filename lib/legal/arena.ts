/**
 * The arena's own details, as they appear on the legal pages.
 *
 * Kept in one place because the same address and email have to agree across
 * Terms and Privacy - a policy that names two different contacts is worse than
 * one that names none.
 *
 * TODO: replace every `null` below with the real detail. Anything left null
 * renders as a visible "to be confirmed" note rather than silently disappearing,
 * so an unfinished page cannot be mistaken for a complete one.
 */
export interface ArenaDetails {
  /** Registered or trading name, if it differs from the arena's brand. */
  legalName: string | null
  /** Full postal address of the arena. */
  address: string | null
  /** Where customers should write about bookings, data, or complaints. */
  email: string | null
  /** Reachable phone number, in the format customers should dial. */
  phone: string | null
  /** City whose courts govern disputes, e.g. "Chennai, Tamil Nadu". */
  jurisdiction: string | null
  /** How long after a booking starts a refund can still be requested. */
  cancellationWindow: string | null
}

export const ARENA: ArenaDetails = {
  legalName: null,
  address: null,
  email: null,
  phone: null,
  jurisdiction: null,
  cancellationWindow: null,
}

export const BRAND_NAME = 'Break Point Arena'
