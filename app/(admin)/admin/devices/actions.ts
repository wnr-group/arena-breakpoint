'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireStaff } from "@/lib/auth/require-admin";

export async function getDeviceTypes() {
  await requireStaff();

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

export async function getDevices() {
  await requireStaff();

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
 * Turns a constraint failure into something an admin can act on.
 *
 * `devices.station_number` is NOT NULL UNIQUE, so the database is what actually
 * stops a duplicate - but it reports it as "duplicate key value violates unique
 * constraint devices_station_number_key", which is not a sentence to put in a toast.
 */
function describeDeviceError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'Station number already exists. Please use a different station number.';
  }
  return error.message;
}

export async function createDevice(formData: FormData) {
  await requireStaff();

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
    return { success: false, error: describeDeviceError(error) };
  }

  revalidatePath('/admin/devices');
  return { success: true };
}

export async function updateDevice(formData: FormData) {
  await requireStaff();

  const id = formData.get('id') as string;
  const device_type_id = formData.get('device_type_id') as string;
  const station_number = formData.get('station_number') as string;
  const status = formData.get('status') as string;
  const specs = formData.get('specs') as string;
  const image_url = formData.get('image_url') as string;
  const hourly_rate = formData.get('hourly_rate') as string;

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
    return { success: false, error: describeDeviceError(error) };
  }

  if (device_type_id && hourly_rate) {
    const { error: rateError } = await supabaseAdmin
      .from('device_types')
      .update({
        regular_hourly_rate: parseFloat(hourly_rate)
      })
      .eq('id', device_type_id);

    if (rateError) {
      return { success: false, error: rateError.message };
    }
  }

  revalidatePath('/admin/devices');
  return { success: true };
}

export async function deleteDevice(id: string) {
  await requireStaff();

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
