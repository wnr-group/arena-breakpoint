"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { formatDbTime } from "@/lib/utils/timeSlots";
import { requireStaff } from "@/lib/auth/require-admin";

export async function getDashboardStats() {
  await requireStaff();

  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const currentTime = now.toTimeString().split(' ')[0];
    const twoHoursTime = twoHoursLater.toTimeString().split(' ')[0];

    // Issued together rather than one after another. None of these depends on
    // another's result, and against a remote database each await was its own
    // ~100ms round trip - five of them in series was most of this page's load
    // time for queries that could all have been in flight at once.
    const [
      { data: todaysBookings, error: bookingsError },
      { count: activeSessions, error: activeError },
      { data: upcomingBookings, error: upcomingError },
      { data: paymentsToday, error: paymentsError },
      { data: devices, error: devicesError },
    ] = await Promise.all([
      // Today's bookings
      supabaseAdmin
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
            upi_amount,
            online_amount
          )
        `)
        .eq("slot_date", today)
        .in("bookings.status", ["confirmed", "checked_in", "completed"]),

      // Active sessions (checked in)
      supabaseAdmin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "checked_in"),

      // Upcoming bookings (next 2 hours)
      supabaseAdmin
        .from("booking_device_slots")
        .select(`
          id,
          bookings!inner(status)
        `)
        .eq("slot_date", today)
        .gte("slot_start_time", currentTime)
        .lte("slot_start_time", twoHoursTime)
        .eq("bookings.status", "confirmed"),

      // Everything settled or part-settled, filtered to today below
      supabaseAdmin
        .from("bookings")
        .select(`
          amount_paid,
          payment_status,
          created_at,
          updated_at,
          payment_groups(paid_at)
        `)
        .in("payment_status", ["paid", "partial"])
        .neq("status", "cancelled"),

      // Device availability
      supabaseAdmin
        .from("devices")
        .select("id, status")
        .eq("status", "available"),
    ]);

    if (bookingsError) throw bookingsError;
    if (activeError) throw activeError;
    if (upcomingError) throw upcomingError;
    if (devicesError) throw devicesError;

    let todaysRevenue = 0;

    if (!paymentsError && paymentsToday) {
      paymentsToday.forEach((booking: any) => {
        const paidAt = booking.payment_groups?.paid_at || booking.updated_at || booking.created_at;
        if (paidAt && paidAt.split('T')[0] === today) {
          todaysRevenue += Number(booking.amount_paid || 0);
        }
      });
    }

    const todaysBookingsCount = todaysBookings?.length || 0;
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
  await requireStaff();

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
  await requireStaff();

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
  await requireStaff();

  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Same reasoning as getDashboardStats: independent queries, so they go out
    // together instead of paying three round trips in series.
    const [
      { data: weekBookings, error: weekError },
      { data: foodOrders, error: foodError },
      { data: allSlots, error: slotsError },
    ] = await Promise.all([
      // This week's revenue - only count amount paid
      supabaseAdmin
        .from("bookings")
        .select("amount_paid, payment_status, created_at, updated_at, payment_groups(paid_at)")
        .in("payment_status", ["paid", "partial"])
        .neq("status", "cancelled"),

      // Today's food orders
      supabaseAdmin
        .from("booking_food_items")
        .select(`
          id,
          created_at,
          bookings!inner(status)
        `)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`),

      // Peak hour analysis
      supabaseAdmin
        .from("booking_device_slots")
        .select("slot_start_time")
        .eq("slot_date", today),
    ]);

    if (weekError) throw weekError;
    if (foodError) throw foodError;
    if (slotsError) throw slotsError;

    // Filter by payment date (paid_at) being within last 7 days
    const thisWeekRevenue = (weekBookings || [])
      .filter((b: any) => {
        const paidAt = b.payment_groups?.paid_at || b.updated_at || b.created_at;
        if (!paidAt) return false;
        return paidAt.split('T')[0] >= sevenDaysAgo;
      })
      .reduce((sum: number, b: any) => sum + Number(b.amount_paid || 0), 0);

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
        peakHour: peakHour ? formatDbTime(`${peakHour[0]}:00`) : "N/A",
        peakHourBookings: peakHour ? peakHour[1] : 0
      }
    };
  } catch (err: any) {
    console.error("Get quick stats error:", err);
    return { success: false, error: err.message };
  }
}

export async function getTodaysRevenueDetails() {
  await requireStaff();

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
        amount_paid,
        device_subtotal,
        food_subtotal,
        subscription_discount,
        promo_discount,
        happy_hour_discount,
        cash_amount,
        card_amount,
        upi_amount,
        online_amount,
        status,
        payment_status,
        created_at,
        updated_at,
        booking_device_slots(
          slot_date,
          slot_start_time,
          slot_end_time,
          device_type,
          device_station_number
        ),
        payment_groups(paid_at)
      `)
      .in("payment_status", ["paid", "partial"])
      .neq("status", "cancelled");

    if (error) throw error;

    // Filter by payment date being today (using paid_at, updated_at, or created_at)
    const filteredBookings = (data || []).filter((booking: any) => {
      const paidAt = booking.payment_groups?.paid_at || booking.updated_at || booking.created_at;
      if (!paidAt) return false;
      return paidAt.split('T')[0] === today;
    });

    return { success: true, bookings: filteredBookings };
  } catch (err: any) {
    console.error("Get today's revenue details error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function getActiveSessionsDetails() {
  await requireStaff();

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
  await requireStaff();

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
  await requireStaff();

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
