'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function getMenuItems() {
  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createMenuItem(formData: FormData) {
  const { error } = await supabaseAdmin.from('menu_items').insert([
    {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price') || 0),
      quantity: Math.max(0, parseInt((formData.get('quantity') as string) || '0', 10)),
      status: formData.get('status') as string,
      description: formData.get('description') as string,
      image_url: formData.get('image_url') as string,
    },
  ])

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/food')
  return { success: true }
}

export async function updateMenuItem(formData: FormData) {
  const id = formData.get('id') as string

  const { error } = await supabaseAdmin
    .from('menu_items')
    .update({
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price') || 0),
      quantity: Math.max(0, parseInt((formData.get('quantity') as string) || '0', 10)),
      status: formData.get('status') as string,
      description: formData.get('description') as string,
      image_url: formData.get('image_url') as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/food')
  return { success: true }
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabaseAdmin.from('menu_items').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/food')
  return { success: true }
}
