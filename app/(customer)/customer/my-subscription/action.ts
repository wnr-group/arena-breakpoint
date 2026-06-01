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
