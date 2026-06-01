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

// NEW: Get device types with availability counts (customer sees types, not individual devices)
export async function getDeviceTypesWithAvailability() {
  try {
    // Get all active device types
    const { data: deviceTypes, error: typesError } = await supabaseAdmin
      .from("device_types")
      .select(`
        id,
        name,
        display_name,
        regular_hourly_rate,
        included_players,
        max_players,
        extra_player_charge,
        description,
        display_order
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (typesError) throw typesError;

    // For each device type, count available devices
    const typesWithCounts = await Promise.all(
      (deviceTypes || []).map(async (type: any) => {
        const { count, error: countError } = await supabaseAdmin
          .from("devices")
          .select("id", { count: "exact", head: true })
          .eq("device_type_id", type.id)
          .eq("status", "available");

        return {
          ...type,
          available_devices_count: countError ? 0 : (count || 0)
        };
      })
    );

    return { success: true, deviceTypes: typesWithCounts };
  } catch (err: any) {
    return { success: false, error: err.message, deviceTypes: [] };
  }
}

// DEPRECATED: Old function that returns individual devices (kept for backwards compatibility)
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

// NEW: Check availability by device TYPE (not specific device)
export async function checkAvailabilityByDeviceType(
  dateString: string,
  deviceTypeId: string
) {
  try {
    // Step 1: Get total available devices of this type
    const { count: totalDevices, error: devicesError } = await supabaseAdmin
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("device_type_id", deviceTypeId)
      .eq("status", "available");

    if (devicesError) throw devicesError;

    const totalAvailable = totalDevices || 0;

    if (totalAvailable === 0) {
      return {
        success: true,
        unavailableSlots: [],
        slotAvailability: {}
      };
    }

    // Step 2: Get all bookings for this device type on this date
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        slot_start_time,
        slot_end_time,
        device:devices!inner(device_type_id),
        bookings!inner(status, lock_expires_at)
      `)
      .eq("device.device_type_id", deviceTypeId)
      .eq("slot_date", dateString)
      .in("bookings.status", ["locked", "confirmed", "checked_in"]);

    if (bookingsError) throw bookingsError;

    const rightNow = new Date().toISOString();

    // Step 3: Count bookings per time slot
    const slotCounts: Record<string, number> = {};

    (bookings || []).forEach((booking: any) => {
      const bookingRecord = booking.bookings;

      // Skip expired locks
      if (bookingRecord.status === "locked" && bookingRecord.lock_expires_at) {
        if (new Date(bookingRecord.lock_expires_at) <= new Date(rightNow)) {
          return;
        }
      }

      // Convert to 12h format for slot label (with leading zeros to match frontend)
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        // Add leading zero for single-digit hours
        const hour12Str = hour12.toString().padStart(2, '0');
        return `${hour12Str}:${minutes} ${ampm}`;
      };

      const startFormatted = formatTime(booking.slot_start_time);
      const endFormatted = formatTime(booking.slot_end_time);
      const slotLabel = `${startFormatted} - ${endFormatted}`;

      slotCounts[slotLabel] = (slotCounts[slotLabel] || 0) + 1;
    });

    // Step 4: Build availability for ALL time slots (not just booked ones)
    const unavailableSlots: string[] = [];
    const slotAvailability: Record<string, { available: number; total: number }> = {};

    // All possible time slots in the system (matching frontend format exactly)
    const allTimeSlots = [
      "10:00 AM - 11:00 AM",
      "11:00 AM - 12:00 PM",
      "01:30 PM - 02:30 PM",
      "02:30 PM - 03:30 PM",
      "04:30 PM - 05:30 PM",
      "07:00 PM - 08:00 PM",
      "08:30 PM - 09:30 PM"
    ];

    allTimeSlots.forEach((slotLabel) => {
      const bookedCount = slotCounts[slotLabel] || 0;
      const available = totalAvailable - bookedCount;

      slotAvailability[slotLabel] = {
        available: Math.max(0, available),
        total: totalAvailable
      };

      if (available <= 0) {
        unavailableSlots.push(slotLabel);
      }
    });

    return {
      success: true,
      unavailableSlots,
      slotAvailability,
      totalDevices: totalAvailable
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      unavailableSlots: [],
      slotAvailability: {}
    };
  }
}

// DEPRECATED: Old function that checks specific device (kept for backwards compatibility)
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
  deviceId: string;  // This is actually deviceTypeId now
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
    const deviceTypeId = payload.deviceId; // This is actually the device type ID

    // Step 1: Get total available devices of this type
    const { count: totalDevices, error: devicesError } = await supabaseAdmin
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("device_type_id", deviceTypeId)
      .eq("status", "available");

    if (devicesError) throw devicesError;

    const totalAvailable = totalDevices || 0;

    if (totalAvailable === 0) {
      return { success: false, error: "No devices of this type are currently available." };
    }

    // Step 2: Get all devices of this type
    const { data: devices, error: deviceListError } = await supabaseAdmin
      .from("devices")
      .select("id")
      .eq("device_type_id", deviceTypeId)
      .eq("status", "available");

    if (deviceListError) throw deviceListError;

    const deviceIds = (devices || []).map((d: any) => d.id);

    if (deviceIds.length === 0) {
      return { success: false, error: "No devices of this type are currently available." };
    }

    // Step 3: Check how many devices are already booked for this slot
    const { data: existingBookings, error: checkError } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        device_id,
        bookings!inner(status, lock_expires_at)
      `)
      .in("device_id", deviceIds)
      .eq("slot_date", payload.date)
      .eq("slot_start_time", startTime)
      .in("bookings.status", ["locked", "confirmed", "checked_in"]);

    if (checkError) throw checkError;

    const rightNow = new Date().toISOString();

    // Count active bookings (exclude expired locks)
    const activeBookingsCount = (existingBookings || []).filter((booking: any) => {
      const bookingRecord = booking.bookings;
      if (bookingRecord.status === "locked" && bookingRecord.lock_expires_at) {
        return new Date(bookingRecord.lock_expires_at) > new Date(rightNow);
      }
      return true; // confirmed or checked_in
    }).length;

    // Step 4: Check if any devices are available
    const availableDevicesCount = totalAvailable - activeBookingsCount;

    if (availableDevicesCount <= 0) {
      return {
        success: false,
        error: "This time slot is fully booked. Please select a different time slot."
      };
    }

    // Slot is available - return success
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

// Helper function to find and assign an available device of the specified type
async function findAvailableDevice(
  deviceTypeId: string,
  slotDate: string,
  slotStartTime: string
): Promise<{ deviceId: string; stationNumber: string } | null> {
  try {
    // Get all devices of this type that are available
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from("devices")
      .select("id, station_number")
      .eq("device_type_id", deviceTypeId)
      .eq("status", "available");

    if (devicesError || !devices || devices.length === 0) {
      return null;
    }

    // Get all bookings for these devices at this time slot
    const { data: bookedDevices, error: bookingsError } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        device_id,
        bookings!inner(status, lock_expires_at)
      `)
      .in("device_id", devices.map((d: any) => d.id))
      .eq("slot_date", slotDate)
      .eq("slot_start_time", slotStartTime)
      .in("bookings.status", ["locked", "confirmed", "checked_in"]);

    if (bookingsError) throw bookingsError;

    const rightNow = new Date().toISOString();

    // Filter out expired locks
    const activelyBookedDeviceIds = (bookedDevices || [])
      .filter((booking: any) => {
        const bookingRecord = booking.bookings;
        if (bookingRecord.status === "locked" && bookingRecord.lock_expires_at) {
          return new Date(bookingRecord.lock_expires_at) > new Date(rightNow);
        }
        return true;
      })
      .map((booking: any) => booking.device_id);

    // Find first available device that's not booked
    const availableDevice = devices.find(
      (device: any) => !activelyBookedDeviceIds.includes(device.id)
    );

    if (!availableDevice) {
      return null;
    }

    return {
      deviceId: availableDevice.id,
      stationNumber: availableDevice.station_number
    };
  } catch (err) {
    console.error("Error finding available device:", err);
    return null;
  }
}

export async function confirmBooking(payload: {
  phone: string;
  name: string;
  email: string;
  deviceTypeId: string;  // Changed from deviceId
  deviceTypeName: string;  // Changed from deviceName
  selectedDate: string;
  selectedSlot: string;
  slotStartTime: string;
  slotEndTime: string;
  hourlyRate: number;
  addons: AddonSelection[];
  subtotal: number;
  total: number;
  playerCount: number;
  includedPlayers: number;
  extraPlayerCharge: number;
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

    // Step 4.5: Auto-assign an available device of the selected type
    const formattedStartTime = formatTime(slotStartTime);
    const assignedDevice = await findAvailableDevice(
      payload.deviceTypeId,
      payload.selectedDate,
      formattedStartTime
    );

    if (!assignedDevice) {
      // Rollback booking if no device available
      await supabaseAdmin.from("bookings").delete().eq("id", booking.id);
      return {
        success: false,
        error: "No devices available for this time slot. Please select another time."
      };
    }

    const extraPlayersCount = Math.max(0, payload.playerCount - payload.includedPlayers);
    const extraPlayersTotal = extraPlayersCount * payload.extraPlayerCharge;

    const { error: slotError } = await supabaseAdmin
      .from("booking_device_slots")
      .insert({
        booking_id: booking.id,
        device_id: assignedDevice.deviceId,  // Auto-assigned device
        slot_date: payload.selectedDate,
        slot_start_time: formattedStartTime,
        slot_end_time: formatTime(slotEndTime),
        duration_hours: 1.0, // Assuming 1 hour slots
        hourly_rate: payload.hourlyRate,
        slot_total: payload.subtotal,
        device_type: payload.deviceTypeName,
        device_station_number: assignedDevice.stationNumber,  // Auto-assigned station
        player_count: payload.playerCount,
        included_players: payload.includedPlayers,
        extra_player_charge: payload.extraPlayerCharge,
        extra_players_total: extraPlayersTotal
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