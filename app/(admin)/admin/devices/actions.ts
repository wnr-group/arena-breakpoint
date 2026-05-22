'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * FETCH: Get all devices from the database
 * Used by the Server Component or client hooks to pass data to the dashboard
 */
export async function getDevices() {
  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('*')
    .order('station_number', { ascending: true })

  if (data) {
    console.log(data)
  }
    
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
  const type = formData.get('type') as string;
  const station_number = formData.get('station_number') as string;
  const status = formData.get('status') as string;
  const specs = formData.get('specs') as string;
  const image_url = formData.get('image_url') as string; 
  const rawHourlyRate = formData.get('hourly_rate');
  const rawQuantity = formData.get('quantity');

  const { error } = await supabaseAdmin
    .from('devices')
    .insert([{ 
      type, 
      station_number, 
      status, 
      specs, 
      image_url,
      hourly_rate: rawHourlyRate ? Number(rawHourlyRate) : 0,
      quantity: rawQuantity ? Math.max(1, parseInt(String(rawQuantity), 10)) : 1 
    }]);

  if (error) {
    return { success: false, error: error.message };
  }

  // Instantly refreshes the route cache to display new records seamlessly
  revalidatePath('/admin/devices');
  return { success: true };
}

/**
 * UPDATE: Modify an existing device's full parameters
 */
export async function updateDevice(formData: FormData) {
  const id = formData.get('id') as string;
  const type = formData.get('type') as string;
  const station_number = formData.get('station_number') as string;
  const status = formData.get('status') as string;
  const specs = formData.get('specs') as string;
  const image_url = formData.get('image_url') as string;
  const rawHourlyRate = formData.get('hourly_rate');
  const rawQuantity = formData.get('quantity');

  if (!id) {
    return { success: false, error: "Missing required device identifier target." };
  }

  const { error } = await supabaseAdmin
    .from('devices')
    .update({ 
      type, 
      station_number, 
      status, 
      specs, 
      image_url,
      hourly_rate: rawHourlyRate ? Number(rawHourlyRate) : 0, 
      quantity: rawQuantity ? Math.max(1, parseInt(String(rawQuantity), 10)) : 1
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