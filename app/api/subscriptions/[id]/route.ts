import { getSubscriptionPlanDetails } from '@/app/(admin)/admin/subscription/actions'
import { NextRequest, NextResponse } from 'next/server'

/*
 * Fetch specific plan details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const plan = await getSubscriptionPlanDetails(id)
    return NextResponse.json(plan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
