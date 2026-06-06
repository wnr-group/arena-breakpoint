"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

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
