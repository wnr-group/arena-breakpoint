'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { arenaToday } from "@/lib/utils/dates";
import { getVerifiedCustomerPhone } from '@/lib/auth/customer-session'

/**
 * The verified caller's own subscription.
 *
 * Replaces getMyActiveSubscriptionByPhone(phone), which took the number from a
 * `?phone=` query parameter - so editing the URL showed anyone else's plan,
 * spend and renewal date. The number now comes from the session instead.
 */
export async function getMySubscription() {
  try {
    const phone = await getVerifiedCustomerPhone()

    if (!phone) {
      return {
        success: false,
        data: null,
        verificationRequired: true,
        message: 'Please verify your mobile number to view your subscription.',
      }
    }

    // 1. Get customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, active_subscription_id')
      .eq('phone', phone)
      .single()

    if (customerError) {
      if (customerError.code === 'PGRST116') {
        return { success: true, data: null, message: 'Customer not found.' }
      }
      throw new Error(customerError.message)
    }

    if (!customer || !customer.active_subscription_id) {
      return { success: true, data: null, message: 'No active subscription.' }
    }

    // 2. Get active subscription
    const { data: subData, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('id', customer.active_subscription_id)
      .eq('status', 'active')
      .gte('end_date', arenaToday())
      .single()

    if (subError) {
      if (subError.code === 'PGRST116') {
        return { success: true, data: null, message: 'No active subscription found.' }
      }
      throw new Error(subError.message)
    }

    return {
      success: true,
      data: subData,
      message: 'Subscription fetched successfully',
    }
  } catch (error: any) {
    console.error('Fetch Subscription by Phone Error:', error.message)
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch subscription details',
    }
  }
}

export interface ActivePlanSummary {
  planId: string
  planName: string
  discountPercentage: number
  endDate: string
  daysRemaining: number
}

/**
 * The membership the caller already holds, in the few fields a banner needs.
 *
 * Separate from `getMySubscription` above, which returns the whole record for
 * the account page. The plans list only wants to say "you are on this one, until
 * then", and pulling the full row to render two lines would mean the plans page
 * failing whenever anything in that larger shape changed.
 *
 * Null covers three cases that all mean the same thing to the caller - not
 * signed in, no membership, or one that has run out - because the banner simply
 * does not render for any of them.
 *
 * Same rule as `resolveActiveMembership`: the pointer on the customer row,
 * status `active`, and an end date that has not passed on the arena's calendar.
 * If those ever disagreed, the plan a customer is shown would not be the plan
 * their bookings are discounted by.
 */
export async function getMyActivePlanSummary(): Promise<ActivePlanSummary | null> {
  try {
    const phone = await getVerifiedCustomerPhone()
    if (!phone) return null

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('active_subscription_id')
      .eq('phone', phone)
      .maybeSingle()

    if (!customer?.active_subscription_id) return null

    const today = arenaToday()

    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('end_date, subscription_plan_id, plan:subscription_plans(name, discount_percentage)')
      .eq('id', customer.active_subscription_id)
      .eq('status', 'active')
      .gte('end_date', today)
      .maybeSingle()

    const plan = (data as any)?.plan
    if (!data?.end_date || !plan) return null

    return {
      planId: String(data.subscription_plan_id || ''),
      planName: plan.name || 'Membership',
      discountPercentage: Number(plan.discount_percentage || 0),
      endDate: String(data.end_date),
      daysRemaining: daysUntil(today, String(data.end_date)),
    }
  } catch (err) {
    // A banner is not worth failing the plans page over.
    console.error('getMyActivePlanSummary error:', err)
    return null
  }
}

/**
 * Whole days from one `YYYY-MM-DD` to another, never negative.
 *
 * Counted in UTC on purpose: both sides are arena calendar dates rather than
 * instants, so the zone cancels out and no host offset can shift the answer.
 * Zero means the membership ends today, which reads as "last day" rather than
 * as expired.
 */
function daysUntil(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.max(0, Math.round((end - start) / 86_400_000))
}
