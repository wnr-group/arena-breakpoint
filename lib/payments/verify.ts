import {
  fetchOrderDetails,
  fetchPaymentDetails,
  refundPayment,
  toPaise,
  verifyRazorpaySignature,
} from '@/lib/razorpay/client'
import {
  claimPaidOrder,
  getBookingByPaymentId,
  getBookingForOrder,
  getPaymentOrder,
  markOrderFulfilled,
  markOrderRefunded,
  type PaymentOrderRow,
  type PaymentPurpose,
} from './orders'
import { fulfilQuote } from './fulfil'

export interface CheckoutResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export type SettleResult =
  | {
      success: true
      bookingId: string
      bookingNumber: string
      amountPaid: number
      purpose: PaymentPurpose
    }
  | {
      success: false
      error: string
      /**
       * True when the failure looks transient (database unreachable, gateway not
       * caught up yet, a claim still in flight). The webhook turns this into a 5xx
       * so Razorpay redelivers; a terminal failure is acknowledged instead.
       */
      retryable?: boolean
    }

/**
 * How long a claimed-but-unfulfilled order is left alone before another caller
 * may resume it. Long enough that an in-flight fulfilment is never duplicated,
 * short enough that Razorpay's webhook retries still land inside the day.
 */
const STRANDED_CLAIM_MS = 3 * 60 * 1000

/**
 * Turns a confirmed payment into a booking.
 *
 * Callers must have already established that the payment is genuine - either via
 * the checkout signature (browser callback) or the webhook signature. From here:
 *
 *  1. Inspect the stored order, without mutating it.
 *  2. Confirm with Razorpay that the money actually landed, for the amount we
 *     priced. Nothing is burned yet, so a gateway blip cannot kill a real payment.
 *  3. Atomic claim - guarantees one payment fulfils at most one booking.
 *  4. Fulfilment - if it fails after the money moved, refund automatically.
 */
async function settlePayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  expectedPurpose: PaymentPurpose | null
): Promise<SettleResult> {
  // ---- 1. Inspect, do not mutate -----------------------------------------
  let existing
  try {
    existing = await getPaymentOrder(razorpayOrderId)
  } catch (err) {
    console.error('Failed to read payment order:', err)
    return {
      success: false,
      error: 'We could not confirm your payment. Please contact support.',
      retryable: true,
    }
  }

  if (!existing) {
    return { success: false, error: 'We could not find this payment. Please contact support.' }
  }

  if (expectedPurpose && existing.purpose !== expectedPurpose) {
    return { success: false, error: 'This payment does not match the requested order.' }
  }

  let order: PaymentOrderRow

  if (existing.status === 'paid' || existing.status === 'fulfilled') {
    // Already settled: a retry, a double submit, or the webhook and the browser
    // arriving together. Return the existing booking, never a second one.
    const settled = await alreadyHandled(existing, razorpayPaymentId)
    if (settled) return settled

    // A 'fulfilled' order whose booking has since been deleted was completed once
    // already; recreating it here would resurrect a cancelled booking.
    if (existing.status !== 'paid') {
      return {
        success: false,
        error: 'This booking is no longer available. Please contact support.',
      }
    }

    // Claimed but never fulfilled, and no booking exists for this payment: a
    // previous attempt died between the claim and the booking. The money is with
    // us, so resume fulfilment from the stored quote rather than stranding it.
    console.warn(
      `Resuming stranded payment order ${razorpayOrderId} (claimed at ${existing.paid_at}, no booking).`
    )
    order = existing
  } else if (existing.status !== 'created') {
    return { success: false, error: 'This payment can no longer be used.' }
  } else {
    // ---- 2. Confirm with the gateway --------------------------------------
    const gateway = await confirmWithGateway(
      razorpayOrderId,
      razorpayPaymentId,
      toPaise(Number(existing.amount))
    )

    if (gateway.outcome === 'rejected') {
      // Deliberately leaves the order in 'created'. If this was transient gateway
      // lag on a real capture, the webhook can still fulfil it later.
      return { success: false, error: gateway.error, retryable: gateway.retryable }
    }

    // ---- 3. Atomic claim --------------------------------------------------
    let claim
    try {
      claim = await claimPaidOrder(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    } catch (err) {
      console.error('Failed to claim payment order:', err)
      return {
        success: false,
        error: 'We could not confirm your payment. Please contact support.',
        retryable: true,
      }
    }

    if (claim.outcome === 'not_found') {
      return { success: false, error: 'We could not find this payment. Please contact support.' }
    }
    if (claim.outcome === 'already_fulfilled') {
      // Lost the race to a concurrent caller; report whatever it produced.
      const settled = await alreadyHandled(claim.order, razorpayPaymentId)
      return (
        settled || {
          success: false,
          error: 'This payment is already being processed. Please check "Retrieve Booking" shortly.',
          retryable: true,
        }
      )
    }
    if (claim.outcome === 'unusable') {
      return { success: false, error: 'This payment can no longer be used.' }
    }

    order = claim.order
  }

  // ---- 4. Fulfilment ------------------------------------------------------
  const result = await fulfilQuote(order.purpose, order.quote, {
    razorpayOrderId,
    razorpayPaymentId,
  })

  if (!result.success) {
    if (result.refundRequired) {
      try {
        await refundPayment(razorpayPaymentId, Number(order.amount))
        await markOrderRefunded(razorpayOrderId, result.error)
      } catch (refundError) {
        // Never hide this: a customer has paid for something they did not get.
        console.error(
          `REFUND FAILED - manual action required. order=${razorpayOrderId} payment=${razorpayPaymentId} amount=${order.amount}`,
          refundError
        )
        return {
          success: false,
          error:
            'Your booking could not be completed and the automatic refund failed. Please contact support with your payment id: ' +
            razorpayPaymentId,
        }
      }
    }

    return { success: false, error: result.error }
  }

  await markOrderFulfilled(razorpayOrderId, result.bookingId)

  return {
    success: true,
    bookingId: result.bookingId,
    bookingNumber: result.bookingNumber,
    amountPaid: Number(order.amount),
    purpose: order.purpose,
  }
}

/**
 * Resolves an order a previous call already claimed.
 *
 * Returns the booking that payment produced, or `null` when the claim is stranded
 * - no booking exists and enough time has passed that no attempt can still be in
 * flight - which tells the caller it is safe to resume fulfilment.
 */
async function alreadyHandled(
  order: PaymentOrderRow,
  razorpayPaymentId: string
): Promise<SettleResult | null> {
  const settled = (booking: { id: string; booking_number: string }): SettleResult => ({
    success: true,
    bookingId: booking.id,
    bookingNumber: booking.booking_number,
    amountPaid: Number(order.amount),
    purpose: order.purpose,
  })

  if (order.booking_id) {
    const booking = await getBookingForOrder(order.booking_id)
    if (booking) return settled(booking)
  }

  // No `booking_id` on the order, but fulfilment may have succeeded and died
  // before writing it back. The booking itself is the source of truth.
  const byPayment = await getBookingByPaymentId(razorpayPaymentId)

  if (byPayment) {
    await markOrderFulfilled(order.razorpay_order_id, byPayment.id)
    return settled(byPayment)
  }

  const claimedAt = order.paid_at ? new Date(order.paid_at).getTime() : 0
  const inFlight = !claimedAt || Date.now() - claimedAt < STRANDED_CLAIM_MS

  if (inFlight) {
    return {
      success: false,
      error: 'This payment is already being processed. Please check "Retrieve Booking" shortly.',
      retryable: true,
    }
  }

  return null
}

type GatewayOutcome =
  | { outcome: 'confirmed' }
  | { outcome: 'unverified' }
  | { outcome: 'rejected'; error: string; retryable?: boolean }

/**
 * Asks Razorpay what actually happened.
 *
 * A definite negative is rejected. An unreachable API returns 'unverified' and is
 * allowed through: the signature already proves Razorpay produced the response,
 * and the amount was fixed server-side when the order was created, so a network
 * blip must not strand a customer who genuinely paid.
 */
async function confirmWithGateway(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  expectedPaise: number
): Promise<GatewayOutcome> {
  let reachedGateway = false

  try {
    const rzpOrder = await fetchOrderDetails(razorpayOrderId)
    reachedGateway = true

    const status = (rzpOrder as any)?.status
    const amount = Number((rzpOrder as any)?.amount)
    const amountPaid = Number((rzpOrder as any)?.amount_paid)

    if (status && status !== 'paid') {
      // Capture may simply not have propagated yet - worth another attempt.
      return {
        outcome: 'rejected',
        error: 'Your payment has not been confirmed yet. Please try again.',
        retryable: true,
      }
    }

    // Underpayment, or an amount that does not match what we priced.
    if (
      Number.isFinite(amount) &&
      Number.isFinite(amountPaid) &&
      (amount !== expectedPaise || amountPaid !== expectedPaise)
    ) {
      console.error(
        `Razorpay amount mismatch for order ${razorpayOrderId}: expected ${expectedPaise} paise, order=${amount} paid=${amountPaid}`
      )
      return { outcome: 'rejected', error: 'Your payment amount did not match this order.' }
    }
  } catch (err) {
    console.error('Could not fetch Razorpay order for verification:', err)
  }

  try {
    const payment = await fetchPaymentDetails(razorpayPaymentId)
    reachedGateway = true

    const status = (payment as any)?.status
    const paymentOrderId = (payment as any)?.order_id
    const paidAmount = Number((payment as any)?.amount)

    // The payment must belong to the order being fulfilled.
    if (paymentOrderId && paymentOrderId !== razorpayOrderId) {
      console.error(
        `Razorpay payment ${razorpayPaymentId} belongs to order ${paymentOrderId}, not ${razorpayOrderId}`
      )
      return { outcome: 'rejected', error: 'This payment does not belong to that order.' }
    }

    // Checked here as well as on the order: if the order fetch above failed, this
    // is the only thing standing between an underpayment and a booking.
    if (Number.isFinite(paidAmount) && paidAmount !== expectedPaise) {
      console.error(
        `Razorpay payment ${razorpayPaymentId} paid ${paidAmount} paise, expected ${expectedPaise}`
      )
      return { outcome: 'rejected', error: 'Your payment amount did not match this order.' }
    }

    if (status && status !== 'captured' && status !== 'authorized') {
      return { outcome: 'rejected', error: 'Your payment did not go through. Please try again.' }
    }

    if (status === 'authorized') {
      console.warn(
        `Razorpay payment ${razorpayPaymentId} is authorized but not captured - enable auto-capture.`
      )
    }
  } catch (err) {
    console.error('Could not fetch Razorpay payment for verification:', err)
  }

  return reachedGateway ? { outcome: 'confirmed' } : { outcome: 'unverified' }
}

/**
 * Browser callback path: validates the checkout signature Razorpay hands to the
 * page, then settles the payment.
 */
export async function verifyAndFulfilPayment(
  response: CheckoutResponse,
  expectedPurpose: PaymentPurpose
): Promise<SettleResult> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response || {}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return { success: false, error: 'Incomplete payment response. Please contact support.' }
  }

  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    console.error('Razorpay signature verification failed for order', razorpay_order_id)
    return { success: false, error: 'We could not verify this payment.' }
  }

  return settlePayment(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    expectedPurpose
  )
}

/**
 * Webhook path: the caller has already verified the webhook body signature, so
 * there is no per-checkout signature to check. Purpose comes from the stored order.
 */
export async function settleWebhookPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<SettleResult> {
  return settlePayment(razorpayOrderId, razorpayPaymentId, 'webhook', null)
}
