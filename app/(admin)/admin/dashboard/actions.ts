"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { formatDbTime } from "@/lib/utils/timeSlots";
import { requireStaff } from "@/lib/auth/require-admin";
import { arenaToday, arenaDateOffset, arenaClockTime } from "@/lib/utils/dates";
import {
  MAX_LIVE_SESSION_HOURS,
  effectiveDeviceStatus,
  getOccupiedDeviceIds,
} from "@/lib/devices/occupancy";

/**
 * Everything the dashboard needs on load, in one call.
 *
 * This was four server actions fired together from the client. They ran
 * concurrently, so the queries were not the problem - the auth check was. Every
 * server action is its own HTTP request, and each one calls `requireStaff()`,
 * which is a network round trip to the Supabase auth server before a single row
 * is read. `resolveRole` is memoised with React `cache()`, but that memo is
 * per-request, so four requests meant four auth round trips that could not
 * overlap with anything.
 *
 * Against the production database those round trips measured 270ms-1.4s each.
 * The queries themselves are sub-millisecond - the heaviest one plans and
 * executes in 0.17ms - so essentially all of this page's load time was spent
 * waiting on the network, most of it re-proving the same operator was staff.
 *
 * One action means one auth check and one browser round trip. The queries below
 * still go out together, and two of them are no longer duplicated: the full
 * paid-bookings set was previously fetched once for today's revenue and again
 * for the week's, and today's slots were fetched three separate times.
 */
export async function getDashboardData() {
  await requireStaff();

  try {
    const today = arenaToday();
    const now = new Date();
    const sevenDaysAgo = arenaDateOffset(-7);

    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    // Arena clock, because that is what `slot_start_time` holds. `toTimeString()`
    // reads the host's, so on Vercel this compared UTC against IST and the
    // "next 2 hours" window pointed 5.5 hours into the arena's past.
    const currentTime = arenaClockTime(now);
    const twoHoursTime = arenaClockTime(twoHoursLater);

    const [
      { data: todaySlots, error: slotsError },
      { count: activeSessions, error: activeError },
      { data: paidBookings, error: paymentsError },
      { data: devices, error: devicesError },
      occupiedDeviceIds,
      { data: recentBookings, error: recentError },
      { data: foodOrders, error: foodError },
    ] = await Promise.all([
      /**
       * Today's slots, once, with no status filter.
       *
       * Serves four of the figures below. The filter is deliberately left off
       * here and applied per-figure in JS: peak hour has always counted every
       * slot on the day regardless of booking status, and pushing a status
       * filter into SQL to share the query would quietly change that number.
       */
      supabaseAdmin
        .from("booking_device_slots")
        .select(`
          id,
          slot_total,
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
        .eq("slot_date", today),

      // Active sessions (checked in). Bounded the same way occupancy is: a
      // booking left in `checked_in` for weeks is a checkout that never
      // happened, and counting those made this tile read eighteen while the
      // arena was empty.
      supabaseAdmin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "checked_in")
        .gte(
          "checked_in_at",
          new Date(Date.now() - MAX_LIVE_SESSION_HOURS * 60 * 60 * 1000).toISOString()
        ),

      // Everything settled or part-settled. Filtered to today and to the week
      // below - the same rows answer both, so they are fetched once.
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

      // Device availability. Every device, not just the ones stored as
      // "available" - a station in use still has that stored value, so the
      // occupied ones have to be subtracted here rather than filtered in SQL.
      supabaseAdmin
        .from("devices")
        .select("id, status"),

      getOccupiedDeviceIds(),

      supabaseAdmin
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
        .limit(8),

      supabaseAdmin
        .from("booking_food_items")
        .select(`
          id,
          created_at,
          bookings!inner(status)
        `)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`),
    ]);

    if (slotsError) throw slotsError;
    if (activeError) throw activeError;
    if (devicesError) throw devicesError;
    if (recentError) throw recentError;

    const slots = (todaySlots || []) as any[];
    const bookedToday = slots.filter((slot) =>
      ["confirmed", "checked_in", "completed"].includes(slot.bookings?.status)
    );

    const upcomingBookings = slots.filter(
      (slot) =>
        slot.bookings?.status === "confirmed" &&
        slot.slot_start_time >= currentTime &&
        slot.slot_start_time <= twoHoursTime
    );

    const schedule = slots
      .filter((slot) => ["confirmed", "checked_in"].includes(slot.bookings?.status))
      .sort((a, b) => String(a.slot_start_time).localeCompare(String(b.slot_start_time)));

    // One pass over the paid set for both windows; `paid_at` falls back the same
    // way it always has, so a booking with no payment group still counts.
    let todaysRevenue = 0;
    let thisWeekRevenue = 0;

    if (!paymentsError && paidBookings) {
      for (const booking of paidBookings as any[]) {
        const paidAt =
          booking.payment_groups?.paid_at || booking.updated_at || booking.created_at;
        if (!paidAt) continue;

        const day = paidAt.split("T")[0];
        const amount = Number(booking.amount_paid || 0);

        if (day === today) todaysRevenue += amount;
        if (day >= sevenDaysAgo) thisWeekRevenue += amount;
      }
    }

    const availableDevices = (devices || []).filter(
      (device: { id: string; status: string | null }) =>
        effectiveDeviceStatus(device.status, occupiedDeviceIds.has(device.id)) === "available"
    ).length;

    // Peak hour over every slot on the day, matching the previous behaviour.
    const hourCounts: Record<string, number> = {};
    for (const slot of slots) {
      if (!slot.slot_start_time) continue;
      const hour = String(slot.slot_start_time).split(":")[0];
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // `as const` so callers narrow on `result.success` - without the literal
    // type both branches infer `success: boolean` and every field reads as
    // possibly-undefined at the call site.
    return {
      success: true as const,
      stats: {
        activeSessions: activeSessions || 0,
        todaysRevenue,
        todaysBookings: bookedToday.length,
        upcomingBookings: upcomingBookings.length,
        availableDevices,
      },
      quickStats: {
        thisWeekRevenue,
        todaysFoodOrders: foodError ? 0 : foodOrders?.length || 0,
        peakHour: peakHour ? formatDbTime(`${peakHour[0]}:00`) : "N/A",
        peakHourBookings: peakHour ? peakHour[1] : 0,
      },
      recentBookings: recentBookings || [],
      schedule,
    };
  } catch (err: any) {
    console.error("Get dashboard data error:", err);
    return { success: false as const, error: err.message };
  }
}

export async function getQuickStats() {
  await requireStaff();

  try {
    const today = arenaToday();
    const now = new Date();
    const sevenDaysAgo = arenaDateOffset(-7);

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
    const today = arenaToday();

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
    const today = arenaToday();

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
    const today = arenaToday();
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    // Arena clock, because that is what `slot_start_time` holds. `toTimeString()`
    // reads the host's, so on Vercel this compared UTC against IST and the
    // "next 2 hours" window pointed 5.5 hours into the arena's past.
    const currentTime = arenaClockTime(now);
    const twoHoursTime = arenaClockTime(twoHoursLater);

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

    // The modal splits these into available and occupied, so it needs the status
    // the floor is actually in rather than the one stored on the row.
    const occupied = await getOccupiedDeviceIds();

    // Transform the data to flatten device_type
    const devices = (data || []).map((device: any) => ({
      id: device.id,
      station_number: device.station_number,
      status: effectiveDeviceStatus(device.status, occupied.has(device.id)),
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
