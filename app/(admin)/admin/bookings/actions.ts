"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export interface BookingFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  deviceType?: string;
}

export interface TimelineBooking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  device_type: string;
  device_station_number: string;
  device_id: string;
  slot_start_time: string;
  slot_end_time: string;
  slot_date: string;
  status: string;
  total_amount: number;
}

export async function getAllBookings(filters?: BookingFilters) {
  try {
    let query = supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_name,
        customer_phone,
        customer_email,
        total_amount,
        device_subtotal,
        food_subtotal,
        status,
        payment_status,
        created_at,
        checked_in_at,
        completed_at,
        lock_expires_at,
        booking_device_slots(
          id,
          slot_date,
          slot_start_time,
          slot_end_time,
          device_type,
          device_station_number,
          duration_hours,
          hourly_rate,
          slot_total,
          player_count,
          included_players,
          extra_player_charge,
          extra_players_total
        ),
        booking_food_items(
          id,
          item_name,
          quantity,
          unit_price,
          line_total,
          status
        )
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `customer_name.ilike.%${filters.searchQuery}%,customer_phone.ilike.%${filters.searchQuery}%,booking_number.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, bookings: data || [] };
  } catch (err: any) {
    console.error("Get bookings error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function getBookingDetails(bookingId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        booking_device_slots(
          id,
          device_id,
          slot_date,
          slot_start_time,
          slot_end_time,
          device_type,
          device_station_number,
          duration_hours,
          hourly_rate,
          slot_total,
          player_count,
          included_players,
          extra_player_charge,
          extra_players_total,
          devices(
            id,
            station_number,
            status,
            specs,
            image_url,
            device_type:device_types(
              id,
              name,
              display_name
            )
          )
        ),
        booking_food_items(
          id,
          menu_item_id,
          item_name,
          item_category,
          quantity,
          unit_price,
          line_total,
          status,
          created_at
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Get booking details error:", err);
    return { success: false, error: err.message, booking: null };
  }
}

export async function updateBookingStatus(bookingId: string, newStatus: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Update booking status error:", err);
    return { success: false, error: err.message };
  }
}

export async function checkInBooking(bookingId: string) {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "checked_in",
        checked_in_at: now,
        updated_at: now
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Check-in booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function checkOutBooking(bookingId: string) {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "completed",
        completed_at: now,
        updated_at: now
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Check-out booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function cancelBooking(bookingId: string, reason?: string) {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: now
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Cancel booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function getBookingStats() {
  try {
    // Get counts by status
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from("bookings")
      .select("status", { count: "exact", head: false });

    if (statusError) throw statusError;

    // Calculate today's revenue
    const today = new Date().toISOString().split("T")[0];
    const { data: todayBookings, error: revenueError } = await supabaseAdmin
      .from("bookings")
      .select("total_amount")
      .gte("created_at", today)
      .in("status", ["confirmed", "checked_in", "completed"]);

    if (revenueError) throw revenueError;

    const todayRevenue = (todayBookings || []).reduce(
      (sum: number, b: any) => sum + Number(b.total_amount || 0),
      0
    );

    // Group by status
    const grouped = (statusCounts || []).reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      stats: {
        total: statusCounts?.length || 0,
        confirmed: grouped.confirmed || 0,
        checked_in: grouped.checked_in || 0,
        completed: grouped.completed || 0,
        cancelled: grouped.cancelled || 0,
        locked: grouped.locked || 0,
        todayRevenue
      }
    };
  } catch (err: any) {
    console.error("Get booking stats error:", err);
    return { success: false, error: err.message, stats: null };
  }
}

export async function addFoodToBooking(
  bookingId: string,
  items: Array<{
    menuItemId: string;
    itemName: string;
    itemCategory: string;
    quantity: number;
    unitPrice: number;
  }>
) {
  try {
    // Calculate new food subtotal
    const lineItems = items.map((item) => ({
      booking_id: bookingId,
      menu_item_id: item.menuItemId,
      item_name: item.itemName,
      item_category: item.itemCategory,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
      status: "pending"
    }));

    const { data: foodItems, error: foodError } = await supabaseAdmin
      .from("booking_food_items")
      .insert(lineItems)
      .select();

    if (foodError) throw foodError;

    // Update booking food_subtotal and total_amount
    const additionalAmount = lineItems.reduce((sum, item) => sum + item.line_total, 0);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("food_subtotal, device_subtotal")
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;

    const newFoodSubtotal = Number(booking.food_subtotal || 0) + additionalAmount;
    const newTotal = Number(booking.device_subtotal || 0) + newFoodSubtotal;

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        food_subtotal: newFoodSubtotal,
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    return { success: true, foodItems, newTotal };
  } catch (err: any) {
    console.error("Add food to booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function createWalkInBooking(payload: {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deviceTypeId: string;
  deviceTypeName: string;
  selectedDate: string;
  selectedSlot: string;
  slotStartTime: string;
  slotEndTime: string;
  hourlyRate: number;
  playerCount: number;
  includedPlayers: number;
  extraPlayerCharge: number;
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

    const startTime = formatTime(payload.slotStartTime);
    const endTime = formatTime(payload.slotEndTime);

    // Step 1: Get or create customer
    const { data: customerId, error: customerError } = await supabaseAdmin
      .rpc("get_or_create_customer", {
        p_phone: payload.customerPhone,
        p_name: payload.customerName,
        p_email: payload.customerEmail || null
      });

    if (customerError) throw customerError;

    // Step 2: Find available device of this type
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from("devices")
      .select("id, station_number")
      .eq("device_type_id", payload.deviceTypeId)
      .eq("status", "available");

    if (devicesError || !devices || devices.length === 0) {
      return { success: false, error: "No devices available" };
    }

    // Get all bookings for these devices at this time slot
    const { data: bookedDevices, error: bookingsError } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        device_id,
        bookings!inner(status, lock_expires_at)
      `)
      .in("device_id", devices.map((d: any) => d.id))
      .eq("slot_date", payload.selectedDate)
      .eq("slot_start_time", startTime)
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

    // Find first available device
    const availableDevice = devices.find(
      (device: any) => !activelyBookedDeviceIds.includes(device.id)
    );

    if (!availableDevice) {
      return { success: false, error: "No devices available for this time slot" };
    }

    // Step 3: Generate booking number
    const { data: bookingNumber, error: bookingNumberError } = await supabaseAdmin
      .rpc("generate_booking_number");

    if (bookingNumberError) throw bookingNumberError;

    // Step 4: Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_email: payload.customerEmail,
        device_subtotal: payload.total,
        food_subtotal: 0,
        total_amount: payload.total,
        status: "confirmed", // Walk-in bookings are immediately confirmed
        payment_status: "pending",
        booking_source: "walk_in",
        lock_expires_at: null
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Step 5: Create device slot
    const extraPlayersCount = Math.max(0, payload.playerCount - payload.includedPlayers);
    const extraPlayersTotal = extraPlayersCount * payload.extraPlayerCharge;

    const { error: slotError } = await supabaseAdmin
      .from("booking_device_slots")
      .insert({
        booking_id: booking.id,
        device_id: availableDevice.id,
        device_type: payload.deviceTypeName,
        device_station_number: availableDevice.station_number,
        slot_date: payload.selectedDate,
        slot_start_time: startTime,
        slot_end_time: endTime,
        duration_hours: 1,
        hourly_rate: payload.hourlyRate,
        slot_total: payload.total,
        player_count: payload.playerCount,
        included_players: payload.includedPlayers,
        extra_player_charge: payload.extraPlayerCharge,
        extra_players_total: extraPlayersTotal
      });

    if (slotError) throw slotError;

    return { success: true, bookingId: booking.id, bookingNumber };
  } catch (err: any) {
    console.error("Create walk-in booking error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Update player count for a booking slot
 */
export async function updatePlayerCount(slotId: string, newPlayerCount: number, maxPlayers: number) {
  try {
    // Validate player count
    if (newPlayerCount < 1) {
      return { success: false, error: "Player count must be at least 1" };
    }

    if (newPlayerCount > maxPlayers) {
      return { success: false, error: `Player count cannot exceed ${maxPlayers}` };
    }

    // Get current slot details
    const { data: slot, error: slotError } = await supabaseAdmin
      .from("booking_device_slots")
      .select("*, bookings!inner(id, device_subtotal, total_amount)")
      .eq("id", slotId)
      .single();

    if (slotError || !slot) throw slotError || new Error("Slot not found");

    const includedPlayers = slot.included_players || 1;
    const extraPlayerCharge = slot.extra_player_charge || 0;
    const oldPlayerCount = slot.player_count || includedPlayers;

    // Calculate new extra players charge
    const newExtraPlayers = Math.max(0, newPlayerCount - includedPlayers);
    const newExtraPlayersTotal = newExtraPlayers * extraPlayerCharge;

    // Calculate old extra players charge
    const oldExtraPlayers = Math.max(0, oldPlayerCount - includedPlayers);
    const oldExtraPlayersTotal = oldExtraPlayers * extraPlayerCharge;

    // Calculate difference in total
    const difference = newExtraPlayersTotal - oldExtraPlayersTotal;

    // Update slot
    const { error: updateSlotError } = await supabaseAdmin
      .from("booking_device_slots")
      .update({
        player_count: newPlayerCount,
        extra_players_total: newExtraPlayersTotal
      })
      .eq("id", slotId);

    if (updateSlotError) throw updateSlotError;

    // Update booking total amounts
    const newDeviceSubtotal = slot.bookings.device_subtotal + difference;
    const newTotalAmount = slot.bookings.total_amount + difference;

    const { error: updateBookingError } = await supabaseAdmin
      .from("bookings")
      .update({
        device_subtotal: newDeviceSubtotal,
        total_amount: newTotalAmount,
        updated_at: new Date().toISOString()
      })
      .eq("id", slot.bookings.id);

    if (updateBookingError) throw updateBookingError;

    return {
      success: true,
      message: `Player count updated to ${newPlayerCount}`,
      newTotal: newTotalAmount
    };
  } catch (err: any) {
    console.error("Update player count error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get bookings for timeline view - specific date
 */
export async function getTimelineBookings(date: string): Promise<{ success: boolean; bookings: TimelineBooking[]; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        id,
        device_id,
        slot_date,
        slot_start_time,
        slot_end_time,
        device_type,
        device_station_number,
        bookings!inner(
          id,
          booking_number,
          customer_name,
          customer_phone,
          status,
          total_amount
        )
      `)
      .eq("slot_date", date)
      .in("bookings.status", ["confirmed", "checked_in", "completed", "locked"])
      .order("slot_start_time", { ascending: true });

    if (error) throw error;

    const timelineBookings: TimelineBooking[] = (data || []).map((slot: any) => ({
      id: slot.bookings.id,
      booking_number: slot.bookings.booking_number,
      customer_name: slot.bookings.customer_name,
      customer_phone: slot.bookings.customer_phone,
      device_type: slot.device_type,
      device_station_number: slot.device_station_number,
      device_id: slot.device_id,
      slot_start_time: slot.slot_start_time,
      slot_end_time: slot.slot_end_time,
      slot_date: slot.slot_date,
      status: slot.bookings.status,
      total_amount: slot.bookings.total_amount
    }));

    return { success: true, bookings: timelineBookings };
  } catch (err: any) {
    console.error("Get timeline bookings error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}
