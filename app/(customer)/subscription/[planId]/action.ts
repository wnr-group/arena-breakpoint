'use server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireVerifiedPhone } from '@/lib/auth/customer-session'
import { revalidatePath } from 'next/cache'
import { addMonthsToDateString, arenaToday } from '@/lib/utils/dates'

interface ActivatePlanParams {
  phone: string
  name: string
  email?: string
  date_of_birth?: string
  planId: string
  paymentId: string
}

export async function activateSubscriptionPlan({
  phone,
  name,
  email,
  date_of_birth,
  planId,
  paymentId,
}: ActivatePlanParams) {
  try {
    // Activating a plan writes a subscription against a customer record and
    // changes what every future booking costs, so the caller has to have proven
    // the number first. This action is a public HTTP endpoint.
    const auth = await requireVerifiedPhone(phone)
    if (!auth.ok) {
      return { success: false, message: auth.error, verificationRequired: true }
    }

    if (!phone || !name || !planId || !paymentId) {
      return {
        success: false,
        message: 'Missing required fields: phone, name, planId, or paymentId',
      }
    }

    // Check if customer exists by phone
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .single()

    let customerId: string

    if (existingCustomer) {
      // Customer exists
      customerId = existingCustomer.id

      // Update customer info if provided
      await supabaseAdmin
        .from('customers')
        .update({
          name,
          email: email || null,
          date_of_birth: date_of_birth || null,
        })
        .eq('id', customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert([
          {
            name,
            phone,
            email: email || null,
            date_of_birth: date_of_birth || null,
          },
        ])
        .select('id')
        .single()

      if (customerError || !newCustomer) {
        return {
          success: false,
          message: `Failed to create customer: ${customerError?.message || 'Unknown error'}`,
        }
      }

      customerId = newCustomer.id
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('duration_months, price, discount_percentage, name')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return { success: false, message: 'Invalid subscription plan.' }
    }

    // Dated by the arena's clock, not the server's. `toISOString()` gave the UTC
    // date, so a membership bought at half past midnight IST started - and
    // therefore expired - a day early.
    const startDate = arenaToday()
    const endDate = addMonthsToDateString(startDate, plan.duration_months || 1)

    // Create subscription record
    const { data: subscription, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert([
        {
          customer_id: customerId,
          subscription_plan_id: planId,
          start_date: startDate,
          end_date: endDate,
          payment_id: paymentId,
          amount_paid: plan.price,
          status: 'active',
        },
      ])
      .select('id')
      .single()

    if (insertError || !subscription) {
      return {
        success: false,
        message: `Failed to create subscription: ${insertError?.message || 'Unknown error'}`,
      }
    }

    // Update customer's active_subscription_id
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({ active_subscription_id: subscription.id })
      .eq('id', customerId)

    if (updateError) {
      console.error(
        'Warning: Subscription created, but failed to update customer active_subscription_id:',
        updateError
      )
    }

    revalidatePath('/subscription')
    revalidatePath('/my-subscription')

    return {
      success: true,
      message: `${plan.name} activated successfully!`,
      data: {
        customerId,
        subscriptionId: subscription.id,
        planId,
        status: 'active',
        validUntil: endDate,
      },
    }
  } catch (error: any) {
    console.error('Activation error:', error)
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to activate plan',
    }
  }
}
