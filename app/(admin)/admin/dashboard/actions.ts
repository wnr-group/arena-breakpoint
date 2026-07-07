"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function getDashboardStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Today's bookings
    const { data: todaysBookings, error: bookingsError } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        slot_total,
        slot_date,
        slot_start_time,
        bookings!inner(
          id,
          status,
          total_amount,
          device_subtotal,
          food_subtotal,
          cash_amount,
          card_amount,
          upi_amount
        )
      `)
      .eq("slot_date", today)
      .in("bookings.status", ["confirmed", "checked_in", "completed"]);

    if (bookingsError) throw bookingsError;

    // Active sessions (checked in today)
    const { count: activeSessions, error: activeError } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "checked_in");

    if (activeError) throw activeError;

    // Upcoming bookings (next 2 hours)
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const currentTime = now.toTimeString().split(' ')[0];
    const twoHoursTime = twoHoursLater.toTimeString().split(' ')[0];

    const { data: upcomingBookings, error: upcomingError } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        id,
        bookings!inner(status)
      `)
      .eq("slot_date", today)
      .gte("slot_start_time", currentTime)
      .lte("slot_start_time", twoHoursTime)
      .eq("bookings.status", "confirmed");

    if (upcomingError) throw upcomingError;

    // Calculate today's revenue
    let todaysRevenue = 0;
    (todaysBookings || []).forEach((booking: any) => {
      todaysRevenue += Number(booking.bookings?.total_amount || 0);
    });

    // Get total bookings count for today
    const todaysBookingsCount = todaysBookings?.length || 0;

    // Get device availability
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from("devices")
      .select("id, status")
      .eq("status", "available");

    if (devicesError) throw devicesError;

    const availableDevices = devices?.length || 0;

    return {
      success: true,
      stats: {
        activeSessions: activeSessions || 0,
        todaysRevenue,
        todaysBookings: todaysBookingsCount,
        upcomingBookings: upcomingBookings?.length || 0,
        availableDevices
      }
    };
  } catch (err: any) {
    console.error("Get dashboard stats error:", err);
    return { success: false, error: err.message };
  }
}

export async function getRecentBookings(limit: number = 10) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_name,
        customer_phone,
        total_amount,
        status,
        payment_status,
        created_at,
        booking_device_slots(
          slot_date,
          slot_start_time,
          device_type,
          device_station_number
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, bookings: data || [] };
  } catch (err: any) {
    console.error("Get recent bookings error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function getTodaysSchedule() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        id,
        slot_start_time,
        slot_end_time,
        device_type,
        device_station_number,
        player_count,
        bookings!inner(
          booking_number,
          customer_name,
          status
        )
      `)
      .eq("slot_date", today)
      .in("bookings.status", ["confirmed", "checked_in"])
      .order("slot_start_time", { ascending: true });

    if (error) throw error;

    return { success: true, schedule: data || [] };
  } catch (err: any) {
    console.error("Get today's schedule error:", err);
    return { success: false, error: err.message, schedule: [] };
  }
}

export async function getQuickStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // This week's revenue
    const { data: weekBookings, error: weekError } = await supabaseAdmin
      .from("bookings")
      .select("total_amount, created_at")
      .gte("created_at", sevenDaysAgo)
      .in("status", ["confirmed", "checked_in", "completed"]);

    if (weekError) throw weekError;

    const thisWeekRevenue = (weekBookings || []).reduce(
      (sum: number, b: any) => sum + Number(b.total_amount || 0),
      0
    );

    // Today's food orders
    const { data: foodOrders, error: foodError } = await supabaseAdmin
      .from("booking_food_items")
      .select(`
        id,
        created_at,
        bookings!inner(status)
      `)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (foodError) throw foodError;

    // Peak hour analysis (most bookings)
    const { data: allSlots, error: slotsError } = await supabaseAdmin
      .from("booking_device_slots")
      .select("slot_start_time")
      .eq("slot_date", today);

    if (slotsError) throw slotsError;

    const hourCounts: Record<string, number> = {};
    (allSlots || []).forEach((slot: any) => {
      const hour = slot.slot_start_time.split(':')[0];
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      success: true,
      stats: {
        thisWeekRevenue,
        todaysFoodOrders: foodOrders?.length || 0,
        peakHour: peakHour ? `${peakHour[0]}:00` : "N/A",
        peakHourBookings: peakHour ? peakHour[1] : 0
      }
    };
  } catch (err: any) {
    console.error("Get quick stats error:", err);
    return { success: false, error: err.message };
  }
}

export async function getTodaysRevenueDetails() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_name,
        customer_phone,
        total_amount,
        device_subtotal,
        food_subtotal,
        cash_amount,
        card_amount,
        upi_amount,
        status,
        payment_status,
        created_at,
        booking_device_slots!inner(
          slot_date,
          slot_start_time,
          slot_end_time,
          device_type,
          device_station_number
        )
      `)
      .eq("booking_device_slots.slot_date", today)
      .in("status", ["confirmed", "checked_in", "completed"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, bookings: data || [] };
  } catch (err: any) {
    console.error("Get today's revenue details error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function getActiveSessionsDetails() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        id,
        slot_start_time,
        slot_end_time,
        slot_date,
        device_type,
        device_station_number,
        player_count,
        bookings!inner(
          id,
          booking_number,
          customer_name,
          customer_phone,
          status
        )
      `)
      .eq("bookings.status", "checked_in")
      .order("slot_start_time", { ascending: true });

    if (error) throw error;

    return { success: true, sessions: data || [] };
  } catch (err: any) {
    console.error("Get active sessions details error:", err);
    return { success: false, error: err.message, sessions: [] };
  }
}

export async function getUpcomingBookingsDetails() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const currentTime = now.toTimeString().split(' ')[0];
    const twoHoursTime = twoHoursLater.toTimeString().split(' ')[0];

    const { data, error } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        id,
        slot_date,
        slot_start_time,
        slot_end_time,
        device_type,
        device_station_number,
        player_count,
        bookings!inner(
          id,
          booking_number,
          customer_name,
          customer_phone,
          status
        )
      `)
      .eq("slot_date", today)
      .gte("slot_start_time", currentTime)
      .lte("slot_start_time", twoHoursTime)
      .eq("bookings.status", "confirmed")
      .order("slot_start_time", { ascending: true });

    if (error) throw error;

    return { success: true, bookings: data || [] };
  } catch (err: any) {
    console.error("Get upcoming bookings details error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function getAvailableDevicesDetails() {
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
          regular_hourly_rate
        )
      `)
      .order("status", { ascending: false }) // Show available first
      .order("station_number", { ascending: true });

    if (error) throw error;

    // Transform the data to flatten device_type
    const devices = (data || []).map((device: any) => ({
      id: device.id,
      station_number: device.station_number,
      status: device.status,
      hourly_rate: device.device_type?.regular_hourly_rate || 0,
      specs: device.specs,
      image_url: device.image_url,
      device_type: device.device_type?.display_name || device.device_type?.name || 'Unknown'
    }));

    return { success: true, devices };
  } catch (err: any) {
    console.error("Get available devices details error:", err);
    return { success: false, error: err.message, devices: [] };
  }
}
