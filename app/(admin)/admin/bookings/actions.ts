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
        customer_dob,
        total_amount,
        amount_paid,
        cash_amount,
        card_amount,
        upi_amount,
        device_subtotal,
        food_subtotal,
        subscription_discount,
        promo_discount,
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

    // Calculate balance_due for each booking
    const bookingsWithBalance = (data || []).map((booking: any) => ({
      ...booking,
      balance_due: Number(booking.total_amount || 0) - Number(booking.amount_paid || 0)
    }));

    return { success: true, bookings: bookingsWithBalance };
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

    // Also fetch line items to check what's unpaid
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .select("*")
      .eq("booking_id", bookingId)
      .order("display_order", { ascending: true });

    if (lineItemsError) {
      console.warn("Failed to fetch line items:", lineItemsError);
    }

    // Calculate unpaid items
    const unpaidItems = lineItems?.filter((item: any) => !item.is_paid) || [];

    // Calculate balance_due
    const balanceDue = Number(data.total_amount || 0) - Number(data.amount_paid || 0);

    return {
      success: true,
      booking: {
        ...data,
        line_items: lineItems || [],
        unpaid_items: unpaidItems,
        balance_due: balanceDue
      }
    };
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
    // VALIDATION: Check stock availability before adding
    const itemIds = items.map(item => item.menuItemId);
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, quantity, status")
      .in("id", itemIds);

    if (menuError) throw menuError;

    // Validate each item
    const unavailableItems: string[] = [];
    const insufficientStock: string[] = [];

    for (const orderItem of items) {
      const menuItem = menuItems?.find((m: any) => m.id === orderItem.menuItemId);

      if (!menuItem) {
        unavailableItems.push(orderItem.itemName);
        continue;
      }

      if (menuItem.status !== "available") {
        unavailableItems.push(menuItem.name);
        continue;
      }

      if (menuItem.quantity < orderItem.quantity) {
        insufficientStock.push(
          `${menuItem.name} (Available: ${menuItem.quantity}, Requested: ${orderItem.quantity})`
        );
      }
    }

    // If validation fails, return error
    if (unavailableItems.length > 0 || insufficientStock.length > 0) {
      let errorMessage = "Cannot add food items:\n";
      if (unavailableItems.length > 0) {
        errorMessage += `Unavailable: ${unavailableItems.join(", ")}\n`;
      }
      if (insufficientStock.length > 0) {
        errorMessage += `Insufficient stock: ${insufficientStock.join(", ")}`;
      }
      return { success: false, error: errorMessage };
    }

    // Calculate new food subtotal
    const foodLineItems = items.map((item) => ({
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
      .insert(foodLineItems)
      .select();

    if (foodError) throw foodError;

    // Update booking food_subtotal and total_amount
    const additionalAmount = foodLineItems.reduce((sum, item) => sum + item.line_total, 0);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("food_subtotal, device_subtotal, subscription_discount, promo_discount, amount_paid")
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;

    const newFoodSubtotal = Number(booking.food_subtotal || 0) + additionalAmount;
    const deviceSubtotal = Number(booking.device_subtotal || 0);
    const subscriptionDiscount = Number(booking.subscription_discount || 0);
    const promoDiscount = Number(booking.promo_discount || 0);
    const amountPaid = Number(booking.amount_paid || 0);

    // Total = device + food - discounts (discounts don't apply to food)
    const newTotal = deviceSubtotal + newFoodSubtotal - subscriptionDiscount - promoDiscount;

    // Get current display_order for line items
    const { data: existingLineItems } = await supabaseAdmin
      .from("booking_line_items")
      .select("display_order")
      .eq("booking_id", bookingId)
      .order("display_order", { ascending: false })
      .limit(1);

    const startingOrder = (existingLineItems?.[0]?.display_order || 0) + 1;

    // Create line items for the food (for audit trail)
    const bookingLineItems = items.map((item, index) => ({
      booking_id: bookingId,
      item_type: 'food',
      description: item.itemName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
      reference_id: item.menuItemId,
      reference_type: 'menu_item',
      added_by: 'admin',
      is_paid: false, // Food added by admin is unpaid
      display_order: startingOrder + index
    }));

    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .insert(bookingLineItems);

    if (lineItemsError) throw lineItemsError;

    // Determine payment status based on amount paid vs new total
    let newPaymentStatus: 'pending' | 'partial' | 'paid';
    if (amountPaid >= newTotal) {
      newPaymentStatus = 'paid'; // Already fully paid
    } else if (amountPaid > 0) {
      newPaymentStatus = 'partial'; // Partially paid (device paid, food unpaid)
    } else {
      newPaymentStatus = 'pending'; // Nothing paid yet
    }

    // Update booking
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        food_subtotal: newFoodSubtotal,
        total_amount: newTotal,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // Decrement inventory for each item
    for (const item of items) {
      const { data: success, error: inventoryError } = await supabaseAdmin.rpc(
        "decrement_menu_item_quantity",
        {
          item_id: item.menuItemId,
          decrement_by: item.quantity,
        }
      );

      if (inventoryError || !success) {
        console.error("Inventory update error:", inventoryError || "Insufficient stock");
        // Log for monitoring but don't fail the order
        // (validation already happened above)
      }
    }

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
  customerDob: string;
  deviceTypeId: string;
  deviceTypeName: string;
  selectedDate: string;
  selectedSlot: string;
  slotStartTime: string;
  slotEndTime: string;
  durationHours: number;
  hourlyRate: number;
  playerCount: number;
  includedPlayers: number;
  extraPlayerCharge: number;
  subtotal: number;
  total: number;
  subscriptionDiscount?: number;
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
        p_email: payload.customerEmail || null,
        p_dob: payload.customerDob
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

    const extraPlayersCount = Math.max(0, payload.playerCount - payload.includedPlayers);
    const extraPlayersTotal = extraPlayersCount * payload.extraPlayerCharge * payload.durationHours;
    const deviceCharges = payload.subtotal; // Base station rate calculated by duration
    const deviceSubtotal = deviceCharges + extraPlayersTotal;
    const subscriptionDiscount = payload.subscriptionDiscount || 0;
    const totalAmount = deviceSubtotal - subscriptionDiscount;

    // Step 4: Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_email: payload.customerEmail,
        customer_dob: payload.customerDob,
        device_subtotal: deviceSubtotal,
        food_subtotal: 0,
        subscription_discount: subscriptionDiscount,
        total_amount: totalAmount,
        status: "confirmed", // Walk-in bookings are immediately confirmed
        payment_status: "pending",
        booking_source: "walk-in",
        lock_expires_at: null
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Step 5: Create device slot
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
        duration_hours: payload.durationHours,
        hourly_rate: payload.hourlyRate,
        slot_total: payload.subtotal,
        player_count: payload.playerCount,
        included_players: payload.includedPlayers,
        extra_player_charge: payload.extraPlayerCharge,
        extra_players_total: extraPlayersTotal
      });

    if (slotError) {
      // Rollback booking if slot creation fails
      await supabaseAdmin.from("bookings").delete().eq("id", booking.id);
      throw slotError;
    }

    // Step 6: Create booking line items for audit trail & receipt presentation
    const lineItems: any[] = [];
    let displayOrder = 1;

    // 6.1: Device charge line item
    lineItems.push({
      booking_id: booking.id,
      item_type: 'device',
      description: `Device Booking (${payload.durationHours}h × ₹${payload.hourlyRate})`,
      quantity: payload.durationHours,
      unit_price: payload.hourlyRate,
      line_total: deviceCharges,
      added_by: 'admin',
      is_paid: false, // Walk-in starts as pending payment
      display_order: displayOrder++
    });

    // 6.2: Extra players line item (if applicable)
    if (extraPlayersCount > 0) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'extra_players',
        description: `Extra Players (${extraPlayersCount} × ₹${payload.extraPlayerCharge} × ${payload.durationHours}h)`,
        quantity: extraPlayersCount * payload.durationHours,
        unit_price: payload.extraPlayerCharge,
        line_total: extraPlayersTotal,
        added_by: 'admin',
        is_paid: false,
        display_order: displayOrder++
      });
    }

    // 6.3: Subscription discount line item (if applicable)
    if (subscriptionDiscount > 0) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'subscription_discount',
        description: 'Subscription Discount',
        quantity: 1,
        unit_price: -subscriptionDiscount,
        line_total: -subscriptionDiscount,
        added_by: 'admin',
        is_paid: false,
        display_order: displayOrder++
      });
    }

    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .insert(lineItems);

    if (lineItemsError) {
      // Rollback booking and slots if line items insertion fails
      await supabaseAdmin.from("booking_device_slots").delete().eq("booking_id", booking.id);
      await supabaseAdmin.from("bookings").delete().eq("id", booking.id);
      throw lineItemsError;
    }

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
    const durationHours = slot.duration_hours || 1;
    const oldPlayerCount = slot.player_count || includedPlayers;

    // Calculate new extra players charge (per hour * duration)
    const newExtraPlayers = Math.max(0, newPlayerCount - includedPlayers);
    const newExtraPlayersTotal = newExtraPlayers * extraPlayerCharge * durationHours;

    // Calculate old extra players charge (per hour * duration)
    const oldExtraPlayers = Math.max(0, oldPlayerCount - includedPlayers);
    const oldExtraPlayersTotal = oldExtraPlayers * extraPlayerCharge * durationHours;

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

export async function closeBooking(bookingId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Close booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function getBookingBillingDetails(bookingId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_name,
        customer_phone,
        total_amount,
        amount_paid,
        device_subtotal,
        food_subtotal,
        subscription_discount,
        promo_discount,
        payment_status,
        status,
        booking_device_slots(
          id,
          duration_hours,
          hourly_rate,
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
          line_total
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error) throw error;

    // Fetch line items to check what's unpaid
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .select("*")
      .eq("booking_id", bookingId)
      .order("display_order", { ascending: true });

    if (lineItemsError) throw lineItemsError;

    // Calculate unpaid amount
    const unpaidItems = lineItems?.filter((item: any) => !item.is_paid) || [];
    const unpaidAmount = unpaidItems.reduce((sum: number, item: any) => sum + Number(item.line_total), 0);
    const balanceDue = Number(data.total_amount) - Number(data.amount_paid || 0);

    return {
      success: true,
      booking: {
        ...data,
        line_items: lineItems,
        unpaid_items: unpaidItems,
        unpaid_amount: unpaidAmount,
        balance_due: balanceDue
      }
    };
  } catch (err: any) {
    console.error("Get billing details error:", err);
    return { success: false, error: err.message, booking: null };
  }
}

// ============================================
// MARK PAYMENT AS PAID
// ============================================

export async function markBookingAsPaid(
  bookingId: string,
  paymentSplit: {
    cashAmount: number;
    cardAmount: number;
    upiAmount: number;
  }
) {
  try {
    // Get booking details including current payment status
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("total_amount, amount_paid, cash_amount, card_amount, upi_amount, booking_number")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) throw new Error("Booking not found");

    // Calculate balance due
    const currentAmountPaid = Number(booking.amount_paid || 0);
    const balanceDue = Number(booking.total_amount) - currentAmountPaid;

    // Validate that split amounts equal balance due (not total, since there might be partial payment)
    const totalSplit = paymentSplit.cashAmount + paymentSplit.cardAmount + paymentSplit.upiAmount;
    if (Math.abs(totalSplit - balanceDue) > 0.01) {
      throw new Error(`Payment split (₹${totalSplit}) does not match balance due (₹${balanceDue})`);
    }

    // Add the new payment to existing split amounts
    const newCashAmount = Number(booking.cash_amount || 0) + paymentSplit.cashAmount;
    const newCardAmount = Number(booking.card_amount || 0) + paymentSplit.cardAmount;
    const newUpiAmount = Number(booking.upi_amount || 0) + paymentSplit.upiAmount;
    const newAmountPaid = currentAmountPaid + totalSplit;

    // Determine if fully paid or still partial
    const newPaymentStatus = Math.abs(newAmountPaid - booking.total_amount) < 0.01 ? "paid" : "partial";

    // Update booking payment status with accumulated split amounts
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        payment_status: newPaymentStatus,
        amount_paid: newAmountPaid,
        cash_amount: newCashAmount,
        card_amount: newCardAmount,
        upi_amount: newUpiAmount,
        // payment_method will be set automatically by trigger
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // Mark all line items as paid
    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .update({ is_paid: true })
      .eq("booking_id", bookingId);

    if (lineItemsError) {
      console.error("Failed to update line items:", lineItemsError);
      throw new Error("Failed to update line items payment status");
    }

    // Update food items status from 'pending' to 'preparing' since they're now paid
    // This allows kitchen staff to start preparing paid orders
    const { error: foodItemsError } = await supabaseAdmin
      .from("booking_food_items")
      .update({ status: "preparing" })
      .eq("booking_id", bookingId)
      .eq("status", "pending"); // Only update pending items (not already preparing/ready/served)

    if (foodItemsError) {
      console.error("Failed to update food items status:", foodItemsError);
      // Don't throw - food status is non-critical, payment is already marked
      // This allows the transaction to succeed even if food status update fails
    }

    return {
      success: true,
      message: `Booking ${booking.booking_number} marked as paid`,
    };
  } catch (error: any) {
    console.error("Error marking booking as paid:", error);
    return { success: false, error: error.message };
  }
}
