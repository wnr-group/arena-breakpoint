'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * FETCH: Get all device types
 */
export async function getDeviceTypes() {
  const { data, error } = await supabaseAdmin
    .from('device_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching device types:', error.message)
    return []
  }

  return data || []
}

/**
 * FETCH: Get all devices from the database with device type info
 */
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

/**
 * CREATE: Add a new device
 */
export async function createDevice(formData: FormData) {
  const device_type_id = formData.get('device_type_id') as string;
  const station_number = formData.get('station_number') as string;
  const status = formData.get('status') as string;
  const specs = formData.get('specs') as string;
  const image_url = formData.get('image_url') as string;

  const { error } = await supabaseAdmin
    .from('devices')
    .insert([{
      device_type_id,
      station_number,
      status,
      specs,
      image_url
    }]);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/devices');
  return { success: true };
}

/**
 * UPDATE: Modify an existing device's full parameters
 */
export async function updateDevice(formData: FormData) {
  const id = formData.get('id') as string;
  const device_type_id = formData.get('device_type_id') as string;
  const station_number = formData.get('station_number') as string;
  const status = formData.get('status') as string;
  const specs = formData.get('specs') as string;
  const image_url = formData.get('image_url') as string;

  if (!id) {
    return { success: false, error: "Missing required device identifier target." };
  }

  const { error } = await supabaseAdmin
    .from('devices')
    .update({
      device_type_id,
      station_number,
      status,
      specs,
      image_url
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/devices');
  return { success: true };
}

/**
 * DELETE: Remove a device completely
 */
export async function deleteDevice(id: string) {
  const { error } = await supabaseAdmin
    .from('devices')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/devices');
  return { success: true };
}
