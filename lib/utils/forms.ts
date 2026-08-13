/**
 * Helpers for gating submit buttons.
 *
 * Every form in the app marks its mandatory fields with a red star and keeps its
 * submit button disabled until they are all filled. These keep that check
 * consistent instead of each form inventing its own "is it filled" rule.
 */

/** A text field counts as filled only once it holds something other than spaces. */
export function isFilled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/** True when every supplied field is filled. */
export function allFilled(...values: Array<string | null | undefined>): boolean {
  return values.every(isFilled)
}

/**
 * Deliberately permissive: enough to catch a typo like a missing "@", not so
 * strict that it rejects a legitimate address. The real check is whether mail to
 * it bounces, which no regex can tell us.
 */
export function isPlausibleEmail(value: string | null | undefined): boolean {
  if (!isFilled(value)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((value as string).trim())
}

/** A positive number entered as text, for price/quantity style fields. */
export function isPositiveNumber(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined || value === '') return false
  const n = Number(value)
  return Number.isFinite(n) && n > 0
}

/** A non-negative number, for fields where zero is a legitimate entry. */
export function isNonNegativeNumber(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined || value === '') return false
  const n = Number(value)
  return Number.isFinite(n) && n >= 0
}
