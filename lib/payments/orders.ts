import { supabaseAdmin } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/razorpay/client'
import type { DeviceBookingQuote, FoodOrderQuote } from './quote'

/**
 * The `payment_orders` table is the bridge between "customer clicked Pay" and
 * "booking exists". It stores the server-computed price so fulfilment reads the
 * amount back from the database rather than trusting whatever the browser posts.
 */

export type PaymentPurpose = 'device_booking' | 'food_order'
export type StoredQuote = DeviceBookingQuote | FoodOrderQuote

export interface PaymentOrderRow {
  id: string
  razorpay_order_id: string
  purpose: PaymentPurpose
  amount: number
  quote: StoredQuote
  customer_phone: string
  status: 'created' | 'paid' | 'fulfilled' | 'failed' | 'refunded'
  booking_id: string | null
  razorpay_payment_id: string | null
  paid_at: string | null
}

/** Razorpay caps receipts at 40 chars, so keep the random suffix short. */
function buildReceipt(purpose: PaymentPurpose): string {
  const prefix = purpose === 'device_booking' ? 'bk' : 'fd'
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export async function createPaymentOrder(params: {
  purpose: PaymentPurpose
  amount: number
  quote: StoredQuote
  customerPhone: string
  notes?: Record<string, string>
}): Promise<{ razorpayOrderId: string; amount: number }> {
  const receipt = buildReceipt(params.purpose)

  const order = await createRazorpayOrder({
    amount: params.amount,
    receipt,
    notes: {
      purpose: params.purpose,
      phone: params.customerPhone,
      ...params.notes,
    },
  })

  const { error } = await supabaseAdmin.from('payment_orders').insert({
    razorpay_order_id: order.id,
    purpose: params.purpose,
    amount: params.amount,
    currency: 'INR',
    quote: params.quote,
    customer_phone: params.customerPhone,
    status: 'created',
  })

  if (error) throw error

  return { razorpayOrderId: order.id, amount: params.amount }
}

/** Read-only lookup, used to inspect an order before anything is mutated. */
export async function getPaymentOrder(
  razorpayOrderId: string
): Promise<PaymentOrderRow | null> {
  const { data } = await supabaseAdmin
    .from('payment_orders')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle()

  return (data as PaymentOrderRow | null) || null
}

export type ClaimResult =
  | { outcome: 'claimed'; order: PaymentOrderRow }
  | { outcome: 'already_fulfilled'; order: PaymentOrderRow }
  | { outcome: 'not_found' }
  | { outcome: 'unusable'; order: PaymentOrderRow }

/**
 * Moves an order from `created` to `paid` in a single conditional update.
 *
 * The `.eq('status', 'created')` filter makes this an atomic claim: if the
 * customer double-clicks or the browser retries, only the first call wins and the
 * rest report `already_fulfilled`, so one payment can never create two bookings.
 */
export async function claimPaidOrder(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<ClaimResult> {
  const { data: claimed, error } = await supabaseAdmin
    .from('payment_orders')
    .update({
      status: 'paid',
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      paid_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', razorpayOrderId)
    .eq('status', 'created')
    .select('*')
    .maybeSingle()

  if (error) throw error

  if (claimed) {
    return { outcome: 'claimed', order: claimed as PaymentOrderRow }
  }

  // Nothing claimed: the order is either unknown or already past `created`.
  const { data: existing } = await supabaseAdmin
    .from('payment_orders')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle()

  if (!existing) return { outcome: 'not_found' }

  const order = existing as PaymentOrderRow

  if (order.status === 'paid' || order.status === 'fulfilled') {
    return { outcome: 'already_fulfilled', order }
  }

  return { outcome: 'unusable', order }
}

export async function markOrderFulfilled(
  razorpayOrderId: string,
  bookingId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('payment_orders')
    .update({
      status: 'fulfilled',
      booking_id: bookingId,
      fulfilled_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', razorpayOrderId)

  if (error) console.error('Failed to mark payment order fulfilled:', error)
}

export async function markOrderRefunded(
  razorpayOrderId: string,
  reason: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('payment_orders')
    .update({ status: 'refunded', failure_reason: reason })
    .eq('razorpay_order_id', razorpayOrderId)

  if (error) console.error('Failed to mark payment order refunded:', error)
}

export async function getBookingForOrder(
  bookingId: string
): Promise<{ id: string; booking_number: string } | null> {
  const { data } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_number')
    .eq('id', bookingId)
    .maybeSingle()

  return (data as { id: string; booking_number: string } | null) || null
}

/**
 * Finds a booking by the payment that funded it.
 *
 * Used to tell a genuinely stranded claim (money taken, no booking) apart from a
 * fulfilment that succeeded but crashed before it could write `booking_id` back.
 * Without this check, resuming would create a second booking for one payment.
 */
export async function getBookingByPaymentId(
  razorpayPaymentId: string
): Promise<{ id: string; booking_number: string } | null> {
  if (!razorpayPaymentId) return null

  const { data } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_number')
    .eq('razorpay_payment_id', razorpayPaymentId)
    .limit(1)
    .maybeSingle()

  return (data as { id: string; booking_number: string } | null) || null
}
