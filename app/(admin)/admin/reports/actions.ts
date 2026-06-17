"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
}

// Food Reports
export async function getFoodReports(filters?: ReportFilters) {
  try {
    let query = supabaseAdmin
      .from("booking_food_items")
      .select(`
        id,
        item_name,
        item_category,
        quantity,
        unit_price,
        line_total,
        status,
        created_at,
        bookings!inner(
          booking_number,
          customer_name,
          status,
          created_at
        )
      `)
      .neq("bookings.status", "cancelled");

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Aggregate by item
    const itemStats: Record<string, {
      itemName: string;
      category: string;
      totalQuantity: number;
      totalRevenue: number;
      orderCount: number;
    }> = {};

    // Aggregate by category
    const categoryStats: Record<string, {
      category: string;
      totalQuantity: number;
      totalRevenue: number;
      itemCount: number;
    }> = {};

    let totalRevenue = 0;
    let totalItemsSold = 0;

    (data || []).forEach((item: any) => {
      const itemName = item.item_name;
      const category = item.item_category || "Uncategorized";

      // Item stats
      if (!itemStats[itemName]) {
        itemStats[itemName] = {
          itemName,
          category,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0
        };
      }
      itemStats[itemName].totalQuantity += item.quantity;
      itemStats[itemName].totalRevenue += Number(item.line_total);
      itemStats[itemName].orderCount += 1;

      // Category stats
      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          totalQuantity: 0,
          totalRevenue: 0,
          itemCount: 0
        };
      }
      categoryStats[category].totalQuantity += item.quantity;
      categoryStats[category].totalRevenue += Number(item.line_total);
      categoryStats[category].itemCount = Object.values(itemStats).filter(i => i.category === category).length;

      totalRevenue += Number(item.line_total);
      totalItemsSold += item.quantity;
    });

    const topItems = Object.values(itemStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const categoryBreakdown = Object.values(categoryStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      success: true,
      summary: {
        totalRevenue,
        totalItemsSold,
        totalOrders: data?.length || 0,
        averageOrderValue: data?.length ? totalRevenue / data.length : 0
      },
      topItems,
      categoryBreakdown,
      recentOrders: data?.slice(0, 20) || []
    };
  } catch (err: any) {
    console.error("Get food reports error:", err);
    return { success: false, error: err.message };
  }
}

// Device Reports
export async function getDeviceReports(filters?: ReportFilters) {
  try {
    let query = supabaseAdmin
      .from("booking_device_slots")
      .select(`
        id,
        device_type,
        device_station_number,
        slot_date,
        slot_start_time,
        slot_end_time,
        duration_hours,
        hourly_rate,
        slot_total,
        player_count,
        extra_players_total,
        created_at,
        bookings!inner(
          booking_number,
          customer_name,
          status,
          created_at
        )
      `)
      .in("bookings.status", ["confirmed", "checked_in", "completed"]);

    if (filters?.dateFrom) {
      query = query.gte("slot_date", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("slot_date", filters.dateTo);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Aggregate by device type
    const deviceTypeStats: Record<string, {
      deviceType: string;
      totalBookings: number;
      totalRevenue: number;
      totalHours: number;
      averagePlayersPerBooking: number;
      extraPlayerRevenue: number;
    }> = {};

    let totalRevenue = 0;
    let totalBookings = 0;
    let totalHours = 0;
    let totalPlayers = 0;

    (data || []).forEach((slot: any) => {
      const deviceType = slot.device_type || "Unknown";

      if (!deviceTypeStats[deviceType]) {
        deviceTypeStats[deviceType] = {
          deviceType,
          totalBookings: 0,
          totalRevenue: 0,
          totalHours: 0,
          averagePlayersPerBooking: 0,
          extraPlayerRevenue: 0
        };
      }

      deviceTypeStats[deviceType].totalBookings += 1;
      deviceTypeStats[deviceType].totalRevenue += Number(slot.slot_total);
      deviceTypeStats[deviceType].totalHours += slot.duration_hours;
      deviceTypeStats[deviceType].extraPlayerRevenue += Number(slot.extra_players_total || 0);

      totalRevenue += Number(slot.slot_total);
      totalBookings += 1;
      totalHours += slot.duration_hours;
      totalPlayers += slot.player_count || 0;
    });

    // Calculate average players per booking for each device type
    Object.keys(deviceTypeStats).forEach(deviceType => {
      const slots = (data || []).filter((s: any) => s.device_type === deviceType);
      const totalPlayersForDevice = slots.reduce((sum: number, s: any) => sum + (s.player_count || 0), 0);
      deviceTypeStats[deviceType].averagePlayersPerBooking = totalPlayersForDevice / slots.length;
    });

    const deviceBreakdown = Object.values(deviceTypeStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Daily utilization (bookings per day)
    const dailyBookings: Record<string, number> = {};
    (data || []).forEach((slot: any) => {
      const date = slot.slot_date;
      dailyBookings[date] = (dailyBookings[date] || 0) + 1;
    });

    return {
      success: true,
      summary: {
        totalRevenue,
        totalBookings,
        totalHours,
        averageRevenuePerBooking: totalBookings ? totalRevenue / totalBookings : 0,
        averagePlayersPerBooking: totalBookings ? totalPlayers / totalBookings : 0
      },
      deviceBreakdown,
      dailyBookings,
      recentBookings: data?.slice(0, 20) || []
    };
  } catch (err: any) {
    console.error("Get device reports error:", err);
    return { success: false, error: err.message };
  }
}

// Revenue Reports
export async function getRevenueReports(filters?: ReportFilters) {
  try {
    let query = supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_name,
        device_subtotal,
        food_subtotal,
        total_amount,
        payment_status,
        booking_source,
        status,
        created_at,
        booking_device_slots(slot_date)
      `)
      .in("status", ["confirmed", "checked_in", "completed"]);

    if (filters?.dateFrom || filters?.dateTo) {
      // We need to filter by slot_date, so we'll do this after fetching
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Filter by slot date if needed
    let filteredData = data || [];
    if (filters?.dateFrom || filters?.dateTo) {
      filteredData = (data || []).filter((booking: any) => {
        const slotDate = booking.booking_device_slots?.[0]?.slot_date || booking.created_at.split('T')[0];
        if (!slotDate) return false;

        if (filters.dateFrom && slotDate < filters.dateFrom) return false;
        if (filters.dateTo && slotDate > filters.dateTo) return false;

        return true;
      });
    }

    let totalRevenue = 0;
    let deviceRevenue = 0;
    let foodRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;

    // Revenue by source
    const sourceBreakdown: Record<string, {
      source: string;
      totalRevenue: number;
      bookingCount: number;
    }> = {};

    // Daily revenue
    const dailyRevenue: Record<string, {
      date: string;
      deviceRevenue: number;
      foodRevenue: number;
      totalRevenue: number;
    }> = {};

    filteredData.forEach((booking: any) => {
      const revenue = Number(booking.total_amount);
      const deviceRev = Number(booking.device_subtotal || 0);
      const foodRev = Number(booking.food_subtotal || 0);
      const source = booking.booking_source || "online";
      const slotDate = booking.booking_device_slots?.[0]?.slot_date || booking.created_at.split('T')[0];

      totalRevenue += revenue;
      deviceRevenue += deviceRev;
      foodRevenue += foodRev;

      if (booking.payment_status === "paid") {
        paidCount += 1;
      } else {
        pendingCount += 1;
      }

      // Source breakdown
      if (!sourceBreakdown[source]) {
        sourceBreakdown[source] = {
          source,
          totalRevenue: 0,
          bookingCount: 0
        };
      }
      sourceBreakdown[source].totalRevenue += revenue;
      sourceBreakdown[source].bookingCount += 1;

      // Daily revenue
      if (!dailyRevenue[slotDate]) {
        dailyRevenue[slotDate] = {
          date: slotDate,
          deviceRevenue: 0,
          foodRevenue: 0,
          totalRevenue: 0
        };
      }
      dailyRevenue[slotDate].deviceRevenue += deviceRev;
      dailyRevenue[slotDate].foodRevenue += foodRev;
      dailyRevenue[slotDate].totalRevenue += revenue;
    });

    const sourceBreakdownArray = Object.values(sourceBreakdown)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const dailyRevenueArray = Object.values(dailyRevenue)
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      summary: {
        totalRevenue,
        deviceRevenue,
        foodRevenue,
        totalBookings: filteredData.length,
        paidBookings: paidCount,
        pendingBookings: pendingCount,
        averageRevenuePerBooking: filteredData.length ? totalRevenue / filteredData.length : 0,
        deviceRevenuePercentage: totalRevenue ? (deviceRevenue / totalRevenue) * 100 : 0,
        foodRevenuePercentage: totalRevenue ? (foodRevenue / totalRevenue) * 100 : 0
      },
      sourceBreakdown: sourceBreakdownArray,
      dailyRevenue: dailyRevenueArray,
      recentTransactions: filteredData.slice(0, 20)
    };
  } catch (err: any) {
    console.error("Get revenue reports error:", err);
    return { success: false, error: err.message };
  }
}

// Dashboard Summary (Overview)
export async function getDashboardSummary(filters?: ReportFilters) {
  try {
    const [foodResult, deviceResult, revenueResult] = await Promise.all([
      getFoodReports(filters),
      getDeviceReports(filters),
      getRevenueReports(filters)
    ]);

    if (!foodResult.success || !deviceResult.success || !revenueResult.success) {
      throw new Error("Failed to fetch dashboard data");
    }

    return {
      success: true,
      summary: {
        totalRevenue: revenueResult.summary?.totalRevenue || 0,
        deviceRevenue: revenueResult.summary?.deviceRevenue || 0,
        foodRevenue: revenueResult.summary?.foodRevenue || 0,
        totalBookings: revenueResult.summary?.totalBookings || 0,
        totalFoodOrders: foodResult.summary?.totalOrders || 0,
        totalItemsSold: foodResult.summary?.totalItemsSold || 0,
        totalHoursBooked: deviceResult.summary?.totalHours || 0
      }
    };
  } catch (err: any) {
    console.error("Get dashboard summary error:", err);
    return { success: false, error: err.message };
  }
}

// ============================================
// EXPENSE MANAGEMENT ACTIONS
// ============================================

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  created_at: string;
  created_by: string | null;
}

export interface ExpenseFilters {
  dateFrom?: string;
  dateTo?: string;
}

export async function getExpenses(filters?: ExpenseFilters) {
  try {
    let query = supabaseAdmin
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (filters?.dateFrom) {
      query = query.gte("date", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("date", filters.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, expenses: data };
  } catch (error: any) {
    return { success: false, error: error.message, expenses: [] };
  }
}

export async function addExpense(expense: {
  date: string;
  description: string;
  amount: number;
  created_by?: string;
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert({
        date: expense.date,
        description: expense.description,
        amount: expense.amount,
        created_by: expense.created_by || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, expense: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateExpense(
  id: string,
  updates: {
    date?: string;
    description?: string;
    amount?: number;
  }
) {
  try {
    const { data, error} = await supabaseAdmin
      .from("expenses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, expense: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// PROFIT & LOSS CALCULATIONS
// ============================================

export async function getProfitAndLoss(filters: { dateFrom: string; dateTo: string }) {
  try {
    // Get revenue from completed bookings using completed_at
    const { data: completedBookings, error: revenueError } = await supabaseAdmin
      .from("bookings")
      .select("amount_paid, device_subtotal, food_subtotal")
      .eq("status", "completed")
      .gte("completed_at", filters.dateFrom)
      .lte("completed_at", filters.dateTo);

    if (revenueError) throw revenueError;

    // Calculate revenue breakdown
    const revenue = completedBookings?.reduce((sum, b) => sum + Number(b.amount_paid || 0), 0) || 0;
    const deviceRevenue = completedBookings?.reduce((sum, b) => sum + Number(b.device_subtotal || 0), 0) || 0;
    const foodRevenue = completedBookings?.reduce((sum, b) => sum + Number(b.food_subtotal || 0), 0) || 0;

    // Get expenses
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from("expenses")
      .select("amount, description")
      .gte("date", filters.dateFrom)
      .lte("date", filters.dateTo);

    if (expensesError) throw expensesError;

    const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

    // Calculate profit
    const profit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      success: true,
      data: {
        revenue,
        deviceRevenue,
        foodRevenue,
        totalExpenses,
        profit,
        profitMargin,
        bookingCount: completedBookings?.length || 0,
        expenseCount: expenses?.length || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
