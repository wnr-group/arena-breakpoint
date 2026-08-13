/**
 * Rounds to whole paise.
 *
 * Lives on its own so pricing helpers that feed into a quote can share it without
 * importing the quote module back (which would be a cycle).
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
