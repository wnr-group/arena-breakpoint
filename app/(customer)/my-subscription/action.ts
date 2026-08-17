'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { arenaToday, daysBetweenDates } from "@/lib/utils/dates";
import { getVerifiedCustomerPhone } from '@/lib/auth/customer-session'

export interface ActivePlanSummary {
  planName: string
  /** Percent off every booking, which lives on the plan rather than the subscription. */
  discountPercentage: number
  /** YYYY-MM-DD, the last day the plan is good for. */
  endDate: string
  daysRemaining: number
}

/**
 * A one-line summary of the caller's plan, for the header badge and the plans page.
 *
 * Kept separate from `getMySubscription()` deliberately. That one joins the whole
 * subscription row to the whole plan row, which is right for a page that renders
 * spend and renewal history; this runs on every navigation, because the header
 * re-checks the session each time, and needs four fields.
 *
 * Returns null for "no plan" and for "not signed in" alike - to a badge that
 * simply does not render, those mean the same thing.
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

    // Same rules the subscription page applies: active, and not yet run out on
    // the arena's calendar rather than the server's.
    const today = arenaToday()

    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('end_date, plan:subscription_plans(name, discount_percentage)')
      .eq('id', customer.active_subscription_id)
      .eq('status', 'active')
      .gte('end_date', today)
      .maybeSingle()

    const plan = (data as any)?.plan
    if (!data?.end_date || !plan) return null

    return {
      planName: plan.name || 'Membership',
      discountPercentage: Number(plan.discount_percentage || 0),
      endDate: data.end_date,
      daysRemaining: Math.max(0, daysBetweenDates(today, data.end_date) ?? 0),
    }
  } catch (error: any) {
    // A badge is not worth an error screen; the pages that need to explain a
    // failure use getMySubscription().
    console.error('Active plan summary error:', error?.message)
    return null
  }
}

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
