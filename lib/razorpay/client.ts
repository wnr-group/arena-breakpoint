import Razorpay from 'razorpay'
import crypto from 'crypto'

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

/**
 * Razorpay is optional in local/dev environments. Every entry point checks this
 * before touching the SDK so an unconfigured environment fails with a clear
 * message instead of crashing at module load.
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(keyId && keySecret)
}

export function getRazorpayKeyId(): string | null {
  return keyId || null
}

let instance: Razorpay | null = null

function getClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error(
      'Razorpay is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
    )
  }

  if (!instance) {
    instance = new Razorpay({ key_id: keyId!, key_secret: keySecret! })
  }

  return instance
}

export interface CreateOrderParams {
  amount: number // in rupees
  receipt: string // Razorpay caps receipts at 40 characters
  notes?: Record<string, string>
}

/** Razorpay works in paise; every amount we hold is in rupees. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  const order = await getClient().orders.create({
    amount: toPaise(params.amount),
    currency: 'INR',
    receipt: params.receipt.slice(0, 40),
    notes: params.notes,
  })

  return order
}

/**
 * Verifies the checkout signature returned to the browser.
 *
 * Razorpay signs `order_id|payment_id` with the key secret. Compared in constant
 * time so the check does not leak the expected digest through timing.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!isRazorpayConfigured() || !orderId || !paymentId || !signature) {
    return false
  }

  const expected = crypto
    .createHmac('sha256', keySecret!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected, 'utf8')
  const receivedBuffer = Buffer.from(signature, 'utf8')

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
}

export async function fetchPaymentDetails(paymentId: string) {
  return await getClient().payments.fetch(paymentId)
}

export async function fetchOrderDetails(orderId: string) {
  return await getClient().orders.fetch(orderId)
}

export async function refundPayment(paymentId: string, amount?: number) {
  return await getClient().payments.refund(paymentId, {
    amount: amount !== undefined ? toPaise(amount) : undefined,
  })
}
