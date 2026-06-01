import { activateSubscriptionPlan } from '@/app/(customer)/customer/subscription/[planId]/action'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, planId, paymentId } = body

    const result = await activateSubscriptionPlan({
      customerId,
      planId,
      paymentId,
    })

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error: any) {
    console.error('API Route Error:', error.message)
    return NextResponse.json(
      { success: false, message: 'Invalid request payload or server error.' },
      { status: 500 }
    )
  }
}
