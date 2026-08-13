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
