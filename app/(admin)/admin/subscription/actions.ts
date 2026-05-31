'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function getSubscriptionPlans() {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return {
      success: true,
      data: data || [],
      mesaage:"Subscription Plan fetch successfully"
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch plans'
    }
  }
}

export async function createSubscriptionPlan(formData: FormData) {
  // Parse boolean correctly depending on if it comes from a hidden input ("true") or a checkbox ("on")
  const isActiveRaw = formData.get('is_active')
  const isActive = isActiveRaw === 'true' || isActiveRaw === 'on'

  const { error } = await supabaseAdmin.from('subscription_plans').insert([
    {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      // Ensure duration is at least 1 month
      duration_months: Math.max(
        1,
        parseInt((formData.get('duration_months') as string) || '1', 10)
      ),
      // Ensure price is formatted as a number
      price: Number(formData.get('price') || 0),
      // Ensure discount is between 0 and 100
      discount_percentage: Math.max(
        0,
        Math.min(100, parseInt((formData.get('discount_percentage') as string) || '20', 10))
      ),
      is_active: isActive,
    },
  ])

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/subscription')
  return { success: true }
}

export async function updateSubscriptionPlan(formData: FormData) {
  const id = formData.get('id') as string

  const isActiveRaw = formData.get('is_active')
  const isActive = isActiveRaw === 'true' || isActiveRaw === 'on'

  const { error } = await supabaseAdmin
    .from('subscription_plans')
    .update({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      duration_months: Math.max(
        1,
        parseInt((formData.get('duration_months') as string) || '1', 10)
      ),
      price: Number(formData.get('price') || 0),
      discount_percentage: Math.max(
        0,
        Math.min(100, parseInt((formData.get('discount_percentage') as string) || '20', 10))
      ),
      is_active: isActive,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/subscription')
  return { success: true }
}

export async function deleteSubscriptionPlan(id: string) {
  const { error } = await supabaseAdmin.from('subscription_plans').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/subscription')
  return { success: true }
}
