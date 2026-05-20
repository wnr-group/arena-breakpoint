import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export interface CreateOrderParams {
  amount: number // in rupees
  receipt: string
  notes?: Record<string, string>
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  const order = await razorpay.orders.create({
    amount: params.amount * 100, // Convert to paise
    currency: 'INR',
    receipt: params.receipt,
    notes: params.notes,
  })

  return order
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const text = orderId + '|' + paymentId
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(text)
    .digest('hex')

  return generatedSignature === signature
}

export async function fetchPaymentDetails(paymentId: string) {
  return await razorpay.payments.fetch(paymentId)
}

export async function refundPayment(paymentId: string, amount?: number) {
  return await razorpay.payments.refund(paymentId, {
    amount: amount ? amount * 100 : undefined,
  })
}
