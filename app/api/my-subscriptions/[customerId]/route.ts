import { getMyActiveSubscription } from '@/app/(customer)/customer/my-subscription/action'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { customerId: string } }) {
  try {
    const customerId = params.customerId

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required in the URL.' },
        { status: 400 }
      )
    }

    const result = await getMyActiveSubscription(customerId)

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 404 })
    }
  } catch (error: any) {
    console.error('My Subscription API Error:', error.message)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
