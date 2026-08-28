/**
 * Browser only, and enforced rather than assumed.
 *
 * The module-level promise below belongs to a single tab, which is what makes
 * sharing it safe. Imported into a *server* component it would be shared across
 * every request the server handles - one customer's session answer could be
 * handed to the next - so this makes that a build error instead of a leak. The
 * same guard, for the same reason, as `lib/auth/roles.ts`.
 */
import 'client-only'

import {
  getCustomerHeaderState,
  type CustomerHeaderState,
} from '@/app/(customer)/my-subscription/action'

/**
 * The signed-in customer and their membership, with concurrent callers sharing
 * one request.
 *
 * Two components ask this in the same mount tick on the pages behind the gate:
 * `CustomerAuthGate`, which decides whether to show the page or ask for a code,
 * and `CustomerSessionMenu` in the navbar, which draws the account control. They
 * were asking separately - two Server Function round trips, each validating the
 * same session cookie, to answer one question. On /retrieve and
 * /my-subscription that was half the requests the page made.
 *
 * Only in-flight requests are shared, and the slot is released as soon as one
 * settles - so this collapses a simultaneous burst without ever handing back a
 * cached answer. A later caller still gets a fresh check, so signing out or a
 * session lapsing is noticed exactly as promptly as before.
 */
let pending: Promise<CustomerHeaderState> | null = null

export function getCustomerHeaderStateShared(): Promise<CustomerHeaderState> {
  if (pending) return pending

  pending = getCustomerHeaderState().catch((error) => {
    // Matches what the action itself returns on failure, so a caller cannot
    // tell the difference between a failed lookup and no session.
    console.error('Error getting customer session:', error)
    return { phone: null, plan: null }
  })

  // Released on settle rather than kept, so nothing here is ever stale.
  void pending.finally(() => {
    pending = null
  })

  return pending
}
