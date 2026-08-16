"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { effectiveDeviceStatus, getOccupiedDeviceIds } from "@/lib/devices/occupancy"

export async function getDevices() {
  const [{ data, error }, occupied] = await Promise.all([
    supabaseAdmin
      .from('devices')
      .select(`
        *,
        device_type:device_types(*)
      `)
      .order('station_number', { ascending: true }),
    getOccupiedDeviceIds(),
  ])

  if (error) {
    console.error('Error fetching devices:', error.message)
    return []
  }

  /**
   * `effective_status` is what the floor actually looks like; `status` is only
   * ever what an admin last typed into the device form. This page counted the
   * latter, so every station read "Available" while people were playing on them.
   *
   * Added alongside rather than overwriting `status`, so the admin device
   * screens can still show and edit the stored value.
   */
  return (data || []).map((device: any) => ({
    ...device,
    effective_status: effectiveDeviceStatus(device.status, occupied.has(device.id)),
  }))
}
