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
        const { data: devices, error: devError } = await supabaseAdmin
          .from("devices")
          .select("id , image_url")
          .eq("device_type_id", type.id)
          .eq("status", "available");

        return {
          ...type,
          available_devices_count: devError ? 0 : (devices || []).length,
          image_url: (devices && devices.length > 0) ? devices[0].image_url : null
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
  durationMinutes?: number; // Optional: for flexible bookings
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
      .select("id, name, phone, email, date_of_birth, active_subscription_id")
      .eq("phone", phone)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - customer doesn't exist
        return { success: true, exists: false, customer: null, subscription: null };
      }
      throw error;
    }

    // Check if customer has active subscription
    let activeSubscription = null;
    if (data.active_subscription_id) {
      const { data: subData, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .select(`
          id,
          start_date,
          end_date,
          status,
          subscription_plan:subscription_plans(
            id,
            name,
            discount_percentage,
            duration_months
          )
        `)
        .eq("id", data.active_subscription_id)
        .eq("status", "active")
        .gte("end_date", new Date().toISOString().split('T')[0])
        .single();

      if (!subError && subData) {
        activeSubscription = {
          id: subData.id,
          plan_name: subData.subscription_plan?.name,
          discount_percentage: subData.subscription_plan?.discount_percentage,
          end_date: subData.end_date,
        };
      }
    }

    return { success: true, exists: true, customer: data, subscription: activeSubscription };
  } catch (err: any) {
    return { success: false, error: err.message, exists: false, customer: null, subscription: null };
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
  date_of_birth: string;
  deviceTypeId: string;  // Changed from deviceId
  deviceTypeName: string;  // Changed from deviceName
  selectedDate: string;
  selectedSlot: string;
  slotStartTime: string;
  slotEndTime: string;
  selectedDuration: number;  // Duration in minutes
  hourlyRate: number;
  addons: AddonSelection[];
  subtotal: number;
  total: number;
  playerCount: number;
  includedPlayers: number;
  extraPlayerCharge: number;
  subscriptionDiscount?: number;
  promoDiscount?: number;
  promoCode?: string | null;
}) {
  try {
    // Step 1: Get or create customer
    const { data: customerId, error: customerError } = await supabaseAdmin
      .rpc("get_or_create_customer", {
        p_phone: payload.phone,
        p_name: payload.name,
        p_email: payload.email || null,
        p_dob: payload.date_of_birth
      });

    if (customerError) throw customerError;

    // Step 2: Generate booking number
    const { data: bookingNumber, error: bookingNumberError } = await supabaseAdmin
      .rpc("generate_booking_number");

    if (bookingNumberError) throw bookingNumberError;

    // Step 3: Calculate line item totals
    // Calculate duration - fallback to calculating from times if selectedDuration is missing
    let durationHours = 0;
    if (payload.selectedDuration && payload.selectedDuration > 0) {
      durationHours = payload.selectedDuration / 60;
    } else {
      // Fallback: calculate from start/end times
      const parseTime = (timeStr: string) => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return 0;
        let [, hours, minutes, period] = match;
        let hour = parseInt(hours);
        if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
        return hour * 60 + parseInt(minutes);
      };
      const startMins = parseTime(payload.slotStartTime);
      const endMins = parseTime(payload.slotEndTime);
      durationHours = (endMins - startMins) / 60;
    }

    const deviceCharges = payload.hourlyRate * durationHours;
    const extraPlayersCount = Math.max(0, payload.playerCount - payload.includedPlayers);
    const extraPlayersTotal = extraPlayersCount * payload.extraPlayerCharge;
    const addonsTotal = payload.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);

    // Calculate device subtotal (device + extra players, NOT food)
    const deviceSubtotal = deviceCharges + extraPlayersTotal;

    // Discounts apply ONLY to device + extra players (NOT food)
    const subscriptionDiscount = payload.subscriptionDiscount || 0;
    const promoDiscount = payload.promoDiscount || 0;

    // Total = device subtotal + food - discounts
    const totalAmount = deviceSubtotal + addonsTotal - subscriptionDiscount - promoDiscount;

    // Step 4: Create booking
    const { data: booking, error: bookingError} = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        customer_phone: payload.phone,
        customer_name: payload.name,
        customer_email: payload.email || null,
        customer_dob: payload.date_of_birth,
        device_subtotal: deviceSubtotal,
        food_subtotal: addonsTotal,
        subscription_discount: subscriptionDiscount,
        promo_discount: promoDiscount,
        total_amount: totalAmount,
        amount_paid: totalAmount,  // Customer pays full amount upfront
        status: "confirmed",
        payment_status: "paid",
        locked_by: "customer"
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;

    // Step 5: Create booking line items for audit trail and consistent display
    const lineItems: any[] = [];
    let displayOrder = 1;

    // 5.1: Device charges line item
    lineItems.push({
      booking_id: booking.id,
      item_type: 'device',
      description: `Device Booking (${durationHours}h × ₹${payload.hourlyRate})`,
      quantity: durationHours,
      unit_price: payload.hourlyRate,
      line_total: deviceCharges,
      added_by: 'customer',
      is_paid: true,
      display_order: displayOrder++
    });

    // 5.2: Extra players line item (if applicable)
    if (extraPlayersCount > 0) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'extra_players',
        description: `Extra Players (${extraPlayersCount} × ₹${payload.extraPlayerCharge})`,
        quantity: extraPlayersCount,
        unit_price: payload.extraPlayerCharge,
        line_total: extraPlayersTotal,
        added_by: 'customer',
        is_paid: true,
        display_order: displayOrder++
      });
    }

    // 5.3: Add-ons/Food line items
    for (const addon of payload.addons) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'food',
        description: addon.name,
        quantity: addon.quantity,
        unit_price: addon.price,
        line_total: addon.price * addon.quantity,
        added_by: 'customer',
        is_paid: true,
        display_order: displayOrder++
      });
    }

    // 5.4: Subscription discount line item (if applicable)
    if (subscriptionDiscount > 0) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'subscription_discount',
        description: 'Subscription Discount',
        quantity: 1,
        unit_price: -subscriptionDiscount,
        line_total: -subscriptionDiscount,
        added_by: 'customer',
        is_paid: true,
        display_order: displayOrder++
      });
    }

    // 5.5: Promo discount line item (if applicable)
    if (promoDiscount > 0) {
      const promoDescription = payload.promoCode
        ? `Promo Code Discount (${payload.promoCode})`
        : 'Promo Code Discount';
      lineItems.push({
        booking_id: booking.id,
        item_type: 'promo_discount',
        description: promoDescription,
        quantity: 1,
        unit_price: -promoDiscount,
        line_total: -promoDiscount,
        added_by: 'customer',
        is_paid: true,
        display_order: displayOrder++
      });
    }

    // Insert all line items
    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .insert(lineItems);

    if (lineItemsError) throw lineItemsError;

    // Step 6: Create device slot
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

    // Step 6.5: Auto-assign an available device of the selected type
    const formattedStartTime = formatTime(slotStartTime);
    const assignedDevice = await findAvailableDevice(
      payload.deviceTypeId,
      payload.selectedDate,
      formattedStartTime
    );

    if (!assignedDevice) {
      // Rollback booking and line items if no device available
      await supabaseAdmin.from("booking_line_items").delete().eq("booking_id", booking.id);
      await supabaseAdmin.from("bookings").delete().eq("id", booking.id);
      return {
        success: false,
        error: "No devices available for this time slot. Please select another time."
      };
    }

    const { error: slotError } = await supabaseAdmin
      .from("booking_device_slots")
      .insert({
        booking_id: booking.id,
        device_id: assignedDevice.deviceId,  // Auto-assigned device
        slot_date: payload.selectedDate,
        slot_start_time: formattedStartTime,
        slot_end_time: formatTime(slotEndTime),
        duration_hours: durationHours,
        hourly_rate: payload.hourlyRate,
        slot_total: deviceCharges,
        device_type: payload.deviceTypeName,
        device_station_number: assignedDevice.stationNumber,  // Auto-assigned station
        player_count: payload.playerCount,
        included_players: payload.includedPlayers,
        extra_player_charge: payload.extraPlayerCharge,
        extra_players_total: extraPlayersTotal
      });

    if (slotError) throw slotError;

    // Step 7: If there are add-ons, create them as food items (for backward compatibility)
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

/**
 * NEW: Check flexible availability for a specific date, device type, and duration
 * Returns available start times in 30-minute intervals
 */
export async function checkFlexibleAvailability(
  dateString: string,
  deviceTypeId: string,
  durationMinutes: number
) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n[Availability ${requestId}] ========================================`);
  console.log(`[Availability ${requestId}] NEW REQUEST`);
  console.log(`[Availability ${requestId}] Date: ${dateString}`);
  console.log(`[Availability ${requestId}] Device Type: ${deviceTypeId}`);
  console.log(`[Availability ${requestId}] Duration: ${durationMinutes} minutes`);

  try {
    // Helper: Convert 24h time to minutes since midnight
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Helper: Convert minutes to 12h format
    const minutesTo12h = (mins: number): string => {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Step 1: Get total available devices of this type
    const { count: totalDevices, error: devicesError } = await supabaseAdmin
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("device_type_id", deviceTypeId)
      .eq("status", "available");

    if (devicesError) throw devicesError;

    const totalAvailable = totalDevices || 0;

    console.log(`[Availability ${requestId}] Total devices of this type: ${totalAvailable}`);

    if (totalAvailable === 0) {
      console.log(`[Availability ${requestId}] ❌ No devices available - returning empty`);
      console.log(`[Availability ${requestId}] ========================================\n`);
      return {
        success: true,
        availableStartTimes: []
      };
    }

    // Step 2: Get all bookings for this device type on this date
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        slot_start_time,
        slot_end_time,
        slot_date,
        device:devices!inner(device_type_id),
        bookings!inner(status, lock_expires_at)
      `)
      .eq("device.device_type_id", deviceTypeId)
      .eq("slot_date", dateString)
      .in("bookings.status", ["locked", "confirmed", "checked_in"]);

    if (bookingsError) {
      console.error(`[Availability ${requestId}] ❌ Database error:`, bookingsError);
      console.log(`[Availability ${requestId}] ========================================\n`);
      throw bookingsError;
    }

    const rightNow = new Date().toISOString();

    console.log(`[Availability ${requestId}] Found ${bookings?.length || 0} bookings for this device type on ${dateString}`);
    if (bookings && bookings.length > 0) {
      console.log(`[Availability ${requestId}] Sample bookings:`, bookings.slice(0, 3).map((b: any) =>
        `${b.slot_start_time}-${b.slot_end_time} (date: ${b.slot_date}, status: ${b.bookings.status})`
      ));
    }

    // Step 3: Build array of occupied time ranges per device (we have totalAvailable devices)
    const activeBookings = (bookings || [])
      .filter((booking: any) => {
        const bookingRecord = booking.bookings;
        // Skip expired locks
        if (bookingRecord.status === "locked" && bookingRecord.lock_expires_at) {
          return new Date(bookingRecord.lock_expires_at) > new Date(rightNow);
        }
        return true;
      })
      .map((booking: any) => {
        const start = timeToMinutes(booking.slot_start_time);
        const end = timeToMinutes(booking.slot_end_time);
        return {
          start,
          end,
          isOvernight: end < start // Booking spans midnight (e.g., 23:00 to 02:00)
        };
      });

    // Helper function to check if two time ranges overlap
    const doTimeRangesOverlap = (
      reqStart: number,
      reqEnd: number,
      reqIsOvernight: boolean,
      bookingStart: number,
      bookingEnd: number,
      bookingIsOvernight: boolean
    ): boolean => {
      // Case 1: Neither is overnight - simple overlap check
      if (!reqIsOvernight && !bookingIsOvernight) {
        return bookingStart < reqEnd && bookingEnd > reqStart;
      }

      // Case 2: Request is overnight, booking is not
      if (reqIsOvernight && !bookingIsOvernight) {
        // Request spans [reqStart, 1440) and [0, reqEnd)
        // Check if booking overlaps with either part
        const overlapBeforeMidnight = bookingStart < 1440 && bookingEnd > reqStart;
        const overlapAfterMidnight = bookingStart < reqEnd && bookingEnd > 0;
        return overlapBeforeMidnight || overlapAfterMidnight;
      }

      // Case 3: Booking is overnight, request is not
      if (!reqIsOvernight && bookingIsOvernight) {
        // Booking spans [bookingStart, 1440) and [0, bookingEnd)
        // Check if request overlaps with either part
        const overlapBeforeMidnight = reqStart < 1440 && reqEnd > bookingStart;
        const overlapAfterMidnight = reqStart < bookingEnd && reqEnd > 0;
        return overlapBeforeMidnight || overlapAfterMidnight;
      }

      // Case 4: Both are overnight - they always overlap
      // (Two overnight bookings will always conflict)
      return true;
    };

    // Step 4: Generate all possible start times (24-hour operation: 12:00 AM to 11:30 PM in 30-min intervals)
    const availableStartTimes: string[] = [];

    // 24-hour operation: check all 30-minute intervals in a day
    for (let startMins = 0; startMins < 24 * 60; startMins += 30) {
      const endMins = startMins + durationMinutes;
      const requestIsOvernight = endMins >= 24 * 60;
      const requestEndMins = requestIsOvernight ? endMins - 24 * 60 : endMins;

      // Count how many devices are busy during this time range
      const conflictCount = activeBookings.filter((booking: any) => {
        return doTimeRangesOverlap(
          startMins,
          requestEndMins,
          requestIsOvernight,
          booking.start,
          booking.end,
          booking.isOvernight
        );
      }).length;

      // If fewer than totalAvailable devices are busy, this slot is available
      const isAvailable = conflictCount < totalAvailable;

      if (isAvailable) {
        availableStartTimes.push(minutesTo12h(startMins));
      }
    }

    console.log(`[Availability ${requestId}] Active bookings after filtering expired: ${activeBookings.length}`);
    console.log(`[Availability ${requestId}] ✅ RESULT: ${availableStartTimes.length} out of 48 slots available`);
    if (availableStartTimes.length > 0) {
      console.log(`[Availability ${requestId}] Sample available times:`, availableStartTimes.slice(0, 5));
    }
    console.log(`[Availability ${requestId}] ========================================\n`);

    return {
      success: true,
      availableStartTimes,
      totalDevices: totalAvailable
    };
  } catch (err: any) {
    console.error(`[Availability ${requestId}] ❌ ERROR:`, err.message);
    console.log(`[Availability ${requestId}] ========================================\n`);
    return {
      success: false,
      error: err.message,
      availableStartTimes: []
    };
  }
}