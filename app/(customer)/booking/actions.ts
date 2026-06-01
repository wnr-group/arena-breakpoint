"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export interface AddonSelection {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DatabaseBookingRow {
  status: string;
  lock_expires_at: string | null;
  booking_device_slots: Array<{
    slot_date: string;
    slot_start_time: string;
    slot_end_time: string;
  }>;
}

export async function getLiveDevicesFromInventory() {
  try {
    const { data, error } = await supabaseAdmin
      .from("devices")
      .select(`
        id,
        station_number,
        status,
        specs,
        image_url,
        device_type:device_types(
          id,
          name,
          display_name,
          regular_hourly_rate,
          included_players,
          max_players,
          extra_player_charge
        )
      `)
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
    // Query booking_device_slots table directly for occupied slots
    const { data, error } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        slot_date,
        slot_start_time,
        slot_end_time,
        bookings!inner(status, lock_expires_at)
      `)
      .eq("device_id", deviceId)
      .eq("slot_date", dateString)
      .in("bookings.status", ["locked", "confirmed", "checked_in"]);

    if (error) throw error;

    const rightNow = new Date().toISOString();

    // Filter out expired locks and build slot labels
    const occupiedSlots = (data || [])
      .filter((slot: any) => {
        const booking = slot.bookings;
        // If locked but expired, don't count as occupied
        if (booking.status === "locked" && booking.lock_expires_at) {
          return new Date(booking.lock_expires_at) > new Date(rightNow);
        }
        // Confirmed and checked_in are always occupied
        return true;
      })
      .map((slot: any) => {
        // Convert 24h time to 12h format to match slot labels
        const formatTime = (time: string) => {
          const [hours, minutes] = time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${hour12}:${minutes} ${ampm}`;
        };

        const startFormatted = formatTime(slot.slot_start_time);
        const endFormatted = formatTime(slot.slot_end_time);
        return `${startFormatted} - ${endFormatted}`;
      });

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
    // With the new schema, we'll check slot availability directly from booking_device_slots
    // No soft lock needed since payment is mocked - we'll create the booking directly in confirmBooking

    // Convert time format from "10:00 AM" to "10:00:00"
    const formatTime = (timeStr: string) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return timeStr;

      let [, hours, minutes, period] = match;
      let hour = parseInt(hours);

      if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

      return `${hour.toString().padStart(2, '0')}:${minutes}:00`;
    };

    const startTime = formatTime(payload.start);
    const endTime = formatTime(payload.end);

    // Check if slot is available
    const { data: existingSlots, error: checkError } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        id,
        bookings!inner(status, lock_expires_at)
      `)
      .eq("device_id", payload.deviceId)
      .eq("slot_date", payload.date)
      .eq("slot_start_time", startTime)
      .in("bookings.status", ["locked", "confirmed", "checked_in"]);

    if (checkError) throw checkError;

    const rightNow = new Date().toISOString();

    // Check for real conflicts (not expired locks)
    const hasConflict = (existingSlots || []).some((slot: any) => {
      const booking = slot.bookings;
      if (booking.status === "locked" && booking.lock_expires_at) {
        return new Date(booking.lock_expires_at) > new Date(rightNow);
      }
      return true; // confirmed or checked_in
    });

    if (hasConflict) {
      return { success: false, error: "Slot claimed by another user. Re-select a time frame." };
    }

    // No soft lock needed - just return success and the slot will be booked in confirmBooking
    // Return a dummy booking ID and expiry for compatibility
    return { success: true, bookingId: "temp", expiresAt: Date.now() + 10 * 60 * 1000 };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function checkCustomerExists(phone: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("id, name, phone, email")
      .eq("phone", phone)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - customer doesn't exist
        return { success: true, exists: false, customer: null };
      }
      throw error;
    }

    return { success: true, exists: true, customer: data };
  } catch (err: any) {
    return { success: false, error: err.message, exists: false, customer: null };
  }
}

export async function confirmBooking(payload: {
  phone: string;
  name: string;
  email: string;
  deviceId: string;
  deviceName: string;
  selectedDate: string;
  selectedSlot: string;
  slotStartTime: string;
  slotEndTime: string;
  hourlyRate: number;
  addons: AddonSelection[];
  subtotal: number;
  total: number;
}) {
  try {
    // Step 1: Get or create customer
    const { data: customerId, error: customerError } = await supabaseAdmin
      .rpc("get_or_create_customer", {
        p_phone: payload.phone,
        p_name: payload.name,
        p_email: payload.email || null
      });

    if (customerError) throw customerError;

    // Step 2: Generate booking number
    const { data: bookingNumber, error: bookingNumberError } = await supabaseAdmin
      .rpc("generate_booking_number");

    if (bookingNumberError) throw bookingNumberError;

    // Step 3: Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        customer_phone: payload.phone,
        customer_name: payload.name,
        customer_email: payload.email || null,
        device_subtotal: payload.subtotal,
        food_subtotal: 0,
        total_amount: payload.total,
        status: "confirmed", // Skip payment, mark as confirmed
        payment_status: "paid", // Mark as paid (mock)
        locked_by: "customer"
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;

    // Step 4: Create device slot
    const slotStartTime = payload.slotStartTime;
    const slotEndTime = payload.slotEndTime;

    // Convert time strings to TIME format (HH:MM)
    const formatTime = (timeStr: string) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return timeStr;

      let [, hours, minutes, period] = match;
      let hour = parseInt(hours);

      if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

      return `${hour.toString().padStart(2, '0')}:${minutes}:00`;
    };

    const { error: slotError } = await supabaseAdmin
      .from("booking_device_slots")
      .insert({
        booking_id: booking.id,
        device_id: payload.deviceId,
        slot_date: payload.selectedDate,
        slot_start_time: formatTime(slotStartTime),
        slot_end_time: formatTime(slotEndTime),
        duration_hours: 1.0, // Assuming 1 hour slots
        hourly_rate: payload.hourlyRate,
        slot_total: payload.subtotal,
        device_type: payload.deviceName.includes("PS5") ? "PS5" : "Standard Snooker",
        device_station_number: payload.deviceName.split("#")[1]?.trim() || "Unknown"
      });

    if (slotError) throw slotError;

    // Step 5: If there are add-ons, create them as food items
    if (payload.addons.length > 0) {
      const foodItems = payload.addons.map((addon) => ({
        booking_id: booking.id,
        menu_item_id: null, // These are peripherals, not menu items
        quantity: addon.quantity,
        unit_price: addon.price,
        line_total: addon.price * addon.quantity,
        item_name: addon.name,
        item_category: "Add-ons",
        status: "served"
      }));

      const { error: foodError } = await supabaseAdmin
        .from("booking_food_items")
        .insert(foodItems);

      if (foodError) throw foodError;
    }

    return { success: true, bookingId: booking.id, bookingNumber };
  } catch (err: any) {
    console.error("Booking error:", err);
    return { success: false, error: err.message };
  }
}