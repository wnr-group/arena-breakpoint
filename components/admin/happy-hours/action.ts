'use server'

import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface HappyHourInput {
  name: string
  discount: number
  devices: string
  schedule: string
  time_range: string
  status: 'LIVE' | 'PAUSED' | 'SCHEDULED'
}

export async function getDevices() {
  const { data, error } = await supabaseAdmin
    .from('devices')
    .select(`
      *,
      device_type:device_types(*)
    `)
    .order('station_number', { ascending: true })

  if (error) {
    console.error('Error fetching devices:', error.message)
    return []
  }

  return data || []
}

export async function getHappyHours() {
  try {
    const { data, error } = await supabaseAdmin
      .from('happy_hour_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Error fetching happy hours:', error.message)
    return { success: false, error: error.message, data: [] }
  }
}

export async function addHappyHour(ruleData: HappyHourInput) {
  try {
    const { data, error } = await supabaseAdmin
      .from('happy_hour_rules')
      .insert([ruleData])
      .select()
      .single()

    if (error) throw error

    // Clear the cache for the page where your table lives
    revalidatePath('/admin/happy-hours') 
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Error adding happy hour:', error.message)
    return { success: false, error: error.message }
  }
}

export async function updateHappyHour(id: string, updates: Partial<HappyHourInput>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('happy_hour_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/happy-hours')
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Error updating happy hour:', error.message)
    return { success: false, error: error.message }
  }
}

export async function deleteHappyHour(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('happy_hour_rules')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/happy-hours')
    
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting happy hour:', error.message)
    return { success: false, error: error.message }
  }
}