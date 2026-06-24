'use server'

import { supabaseAdmin } from '@/lib/supabase/server'

export async function getMyActiveSubscription(customerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select(
        `*,
            plan:subscription_plans(*)`
      )
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      return { success: true, data: null, message: 'No active subscription found.' }
    }

    if (error) throw new Error(error.message)

    return {
      success: true,
      data: data,
      message: 'Subscription fetched successfully',
    }
  } catch (error: any) {
    console.error('Fetch Subscription Error:', error.message)
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch subscription details',
    }
  }
}

export async function getMyActiveSubscriptionByPhone(phone: string) {
  try {
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
      .gte('end_date', new Date().toISOString().split('T')[0])
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
