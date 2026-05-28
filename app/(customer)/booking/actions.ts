"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export interface AddonSelection {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DatabaseBookingRow {
  selected_slot: string;
  status: string;
  slot_lock_expiry: string | number;
}

export async function getLiveDevicesFromInventory() {
  try {
    const { data, error } = await supabaseAdmin
      .from("devices")
      .select("id, type, station_number, hourly_rate, status, specs, image_url, quantity")
      .neq("status", "inactive")
      .order("station_number", { ascending: true });

    if (error) throw error;
    return { success: true, devices: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, devices: [] };
  }
}

export async function fetchLiveActiveBookings(dateString: string, deviceId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("selected_slot, status, slot_lock_expiry")
      .eq("selected_date", dateString)
      .eq("device_id", deviceId)
      .in("status", ["soft_locked", "confirmed"]);

    if (error) throw error;

    const rightNow = Date.now();
    const occupiedSlots = ((data as unknown as DatabaseBookingRow[]) || [])
      .filter((b: DatabaseBookingRow) => {
        if (b.status === "soft_locked" && Number(b.slot_lock_expiry) < rightNow) {
          return false;
        }
        return true;
      })
      .map((b: DatabaseBookingRow) => b.selected_slot);

    return { success: true, occupiedSlots };
  } catch (err: any) {
    return { success: false, error: err.message, occupiedSlots: [] };
  }
}

export async function initializeSoftLockReservation(payload: {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  hourlyRate: number;
  date: string;
  slotLabel: string;
  start: string;
  end: string;
  addons: AddonSelection[];
  subtotal: number;
  total: number;
}) {
  try {
    const stringifiedDate = payload.date;
    const rightNow = Date.now();

    const { data: conflicts, error: checkError } = await supabaseAdmin
      .from("bookings")
      .select("status, slot_lock_expiry")
      .eq("selected_date", stringifiedDate)
      .eq("selected_slot", payload.slotLabel)
      .eq("device_id", payload.deviceId)
      .in("status", ["soft_locked", "confirmed"]);

    if (checkError) throw checkError;

    const realConflictExists = ((conflicts as unknown as DatabaseBookingRow[]) || []).some((c: DatabaseBookingRow) => {
      if (c.status === "confirmed") return true;
      if (c.status === "soft_locked" && Number(c.slot_lock_expiry) > rightNow) return true;
      return false;
    });

    if (realConflictExists) {
      return { success: false, error: "Slot claimed by another user. Re-select a time frame." };
    }

    const lockExpiryTimestamp = rightNow + 10 * 60 * 1000;

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert([{
        device_id: payload.deviceId,
        device_name: payload.deviceName,
        device_type: payload.deviceType,
        hourly_rate: payload.hourlyRate,
        selected_date: stringifiedDate,
        selected_slot: payload.slotLabel,
        slot_start_time: payload.start,
        slot_end_time: payload.end,
        addons: payload.addons,
        subtotal: payload.subtotal,
        total: payload.total,
        status: "soft_locked",
        slot_lock_expiry: lockExpiryTimestamp
      }])
      .select("id")
      .single();

    if (error) throw error;
    return { success: true, bookingId: data.id, expiresAt: lockExpiryTimestamp };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}