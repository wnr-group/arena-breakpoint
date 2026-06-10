"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, Calendar, Users, Clock,
  Gamepad2, UtensilsCrossed, Activity, ArrowRight,
  CheckCircle2, Loader2, AlertCircle, Plus, Eye
} from "lucide-react";
import { BookingStatusBadge } from "@/components/admin/bookings/BookingStatusBadge";
import {
  getDashboardStats,
  getRecentBookings,
  getTodaysSchedule,
  getQuickStats
} from "./actions";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResult, bookingsResult, scheduleResult, quickStatsResult] = await Promise.all([
        getDashboardStats(),
        getRecentBookings(8),
        getTodaysSchedule(),
        getQuickStats()
      ]);

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
      if (bookingsResult.success) {
        setRecentBookings(bookingsResult.bookings);
      }
      if (scheduleResult.success) {
        setTodaysSchedule(scheduleResult.schedule);
      }
      if (quickStatsResult.success) {
        setQuickStats(quickStatsResult.stats);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">
            DASHBOARD
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Welcome back! Here's what's happening today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{getCurrentTime()}</span>
          </div>
          <Button
            onClick={() => router.push("/admin/bookings/walk-in")}
            className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-10 px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Walk-In
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-green-500/70 mb-1">
                Today's Revenue
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                ₹{stats?.todaysRevenue?.toLocaleString('en-IN') || 0}
              </h3>
              <p className="text-[10px] text-zinc-600">
                From {stats?.todaysBookings || 0} bookings
              </p>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-blue-500/70 mb-1">
                Active Sessions
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                {stats?.activeSessions || 0}
              </h3>
              <p className="text-[10px] text-zinc-600">
                Currently playing
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-amber-500/70 mb-1">
                Upcoming
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                {stats?.upcomingBookings || 0}
              </h3>
              <p className="text-[10px] text-zinc-600">
                Next 2 hours
              </p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-purple-500/70 mb-1">
                Available Devices
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                {stats?.availableDevices || 0}
              </h3>
              <p className="text-[10px] text-zinc-600">
                Ready to use
              </p>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Gamepad2 className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#121212] border-[#27272a] p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-zinc-500 mb-1">
                This Week
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                ₹{quickStats?.thisWeekRevenue?.toLocaleString('en-IN') || 0}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-green-500">
                <TrendingUp className="h-3 w-3" />
                <span>Last 7 days</span>
              </div>
            </div>
            <div className="p-2 bg-zinc-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-zinc-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#121212] border-[#27272a] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase text-zinc-500">
              Today's Food Orders
            </p>
            <UtensilsCrossed className="h-4 w-4 text-zinc-600" />
          </div>
          <h4 className="text-2xl font-black text-white">
            {quickStats?.todaysFoodOrders || 0}
          </h4>
          <p className="text-xs text-zinc-600 mt-1">
            Active F&B operations
          </p>
        </Card>

        <Card className="bg-[#121212] border-[#27272a] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase text-zinc-500">
              Peak Hour Today
            </p>
            <Clock className="h-4 w-4 text-zinc-600" />
          </div>
          <h4 className="text-2xl font-black text-white">
            {quickStats?.peakHour || "N/A"}
          </h4>
          <p className="text-xs text-zinc-600 mt-1">
            {quickStats?.peakHourBookings || 0} bookings
          </p>
        </Card>

        <Card className="bg-[#121212] border-[#27272a] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase text-zinc-500">
              Quick Actions
            </p>
            <ArrowRight className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => router.push("/admin/bookings")}
              size="sm"
              className="bg-primary hover:bg-primary-hover text-black font-black w-full justify-center "
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Bookings
            </Button>
            <Button
              onClick={() => router.push("/admin/reports")}
              size="sm"
              className="w-full justify-center bg-primary hover:bg-primary-hover text-black font-black"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="bg-[#121212] border-[#27272a] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase text-zinc-400">
              Today's Schedule
            </h3>
            <Button
              onClick={() => router.push("/admin/bookings")}
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500 hover:text-white"
            >
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {todaysSchedule.length > 0 ? (
              todaysSchedule.map((slot: any) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-zinc-900 rounded-lg">
                      <span className="text-xs font-black text-primary">
                        {slot.slot_start_time.substring(0, 5)}
                      </span>
                      <span className="text-[8px] text-zinc-600">
                        {slot.slot_end_time.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">
                        {slot.bookings?.customer_name || "Unknown"}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {slot.device_type} - {slot.device_station_number}
                      </p>
                      <p className="text-[10px] text-zinc-700 mt-0.5">
                        {slot.player_count} player{slot.player_count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookingStatusBadge status={slot.bookings?.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-zinc-800 mb-3" />
                <p className="text-sm text-zinc-600">No bookings scheduled for today</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card className="bg-[#121212] border-[#27272a] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase text-zinc-400">
              Recent Bookings
            </h3>
            <Button
              onClick={() => router.push("/admin/bookings")}
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500 hover:text-white"
            >
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking: any) => {
                const slot = booking.booking_device_slots?.[0];
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg hover:border-zinc-700 transition-colors cursor-pointer"
                    onClick={() => router.push("/admin/bookings")}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">
                          {booking.booking_number}
                        </p>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <p className="text-xs text-zinc-600">
                        {booking.customer_name} • {booking.customer_phone}
                      </p>
                      {slot && (
                        <p className="text-[10px] text-zinc-700 mt-1">
                          {slot.device_type} • {new Date(slot.slot_date).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">
                        ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[9px] text-zinc-600 uppercase mt-0.5">
                        {booking.payment_status}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-zinc-800 mb-3" />
                <p className="text-sm text-zinc-600">No recent bookings</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-[#121212] border-[#27272a] p-6">
        <h3 className="text-sm font-black uppercase text-zinc-400 mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-600">Bookings System</p>
              <p className="text-sm font-bold text-white">Operational</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-600">Payment Gateway</p>
              <p className="text-sm font-bold text-white">Operational</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-600">Food Orders</p>
              <p className="text-sm font-bold text-white">Operational</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#27272a] rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-600">Database</p>
              <p className="text-sm font-bold text-white">Connected</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
