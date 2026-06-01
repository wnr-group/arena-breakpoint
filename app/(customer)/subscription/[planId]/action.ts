'use server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActivatePlanParams {
  customerId: string
  planId: string
  paymentId: string
}
export async function activateSubscriptionPlan({
  customerId,
  planId,
  paymentId,
}: ActivatePlanParams) {
  try {
    if (!customerId || !planId || !paymentId) {
      return {
        success: false,
        message: 'Missing required fields: customerId, planId, or paymentId',
      }
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('duration_months, price, discount_percentage')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return { success: false, message: 'Invalid subscription plan.' }
    }

    const startDate = new Date()
    const endDate = new Date(startDate)

    if (plan.duration_months) {
      endDate.setMonth(endDate.getMonth() + plan.duration_months)
    }

    const discountMultiplier = (100 - (plan.discount_percentage || 0)) / 100
    const amountPaid = plan.price * discountMultiplier

    const { error: insertError } = await supabaseAdmin.from('subscriptions').insert([
      {
        customer_id: customerId,
        subscription_plan_id: planId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        payment_id: paymentId,
        amount_paid: amountPaid,
        status: 'active',
      },
    ])

    if (insertError) {
      throw new Error(`Failed to create subscription record: ${insertError.message}`)
    }

    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({ active_subscription: planId })
      .eq('id', customerId)

    if (updateError) {
      console.error(
        'Critical: Subscription created, but failed to update customer status:',
        updateError
      )
    }

    revalidatePath('/customer/subscription')
    revalidatePath('/customer/my-subscription')

    return {
      success: true,
      message: 'Subscription activated successfully!',
      data: {
        customerId,
        planId,
        status: 'active',
        validUntil: endDate.toISOString().split('T')[0],
      },
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to activate plan',
    }
  }
}
