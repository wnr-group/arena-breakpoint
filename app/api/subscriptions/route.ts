import { getSubscriptionPlans } from '@/app/(admin)/admin/subscription/actions'
import { activateSubscriptionPlan } from '@/app/(customer)/customer/subscription/[planId]/action'
import { NextResponse } from 'next/server'

/*
 * Fetch all subscription plans
 */
export async function GET() {
  try {
    const plan = await getSubscriptionPlans()
    return NextResponse.json(plan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
