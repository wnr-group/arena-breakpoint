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
  getQuickStats,
  getTodaysRevenueDetails,
  getActiveSessionsDetails,
  getUpcomingBookingsDetails,
  getAvailableDevicesDetails
} from "./actions";
import { TodaysRevenueModal } from "@/components/admin/dashboard/TodaysRevenueModal";
import { ActiveSessionsModal } from "@/components/admin/dashboard/ActiveSessionsModal";
import { UpcomingBookingsModal } from "@/components/admin/dashboard/UpcomingBookingsModal";
import { AvailableDevicesModal } from "@/components/admin/dashboard/AvailableDevicesModal";
import { BreakpointLoader } from "@/components/shared/BreakpointLoader";
import { BookingDetailModal } from "@/components/admin/bookings/BookingDetailModal";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<any>(null);

  // Modal states
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [revenueDetails, setRevenueDetails] = useState<any[]>([]);
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [sessionsDetails, setSessionsDetails] = useState<any[]>([]);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [upcomingDetails, setUpcomingDetails] = useState<any[]>([]);
  const [devicesModalOpen, setDevicesModalOpen] = useState(false);
  const [devicesDetails, setDevicesDetails] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);

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

  const handleRevenueClick = async () => {
    const result = await getTodaysRevenueDetails();
    if (result.success) {
      setRevenueDetails(result.bookings);
      setRevenueModalOpen(true);
    }
  };

  const handleSessionsClick = async () => {
    const result = await getActiveSessionsDetails();
    if (result.success) {
      setSessionsDetails(result.sessions);
      setSessionsModalOpen(true);
    }
  };

  const handleUpcomingClick = async () => {
    const result = await getUpcomingBookingsDetails();
    if (result.success) {
      setUpcomingDetails(result.bookings);
      setUpcomingModalOpen(true);
    }
  };

  const handleDevicesClick = async () => {
    const result = await getAvailableDevicesDetails();
    if (result.success) {
      setDevicesDetails(result.devices);
      setDevicesModalOpen(true);
    }
  };

  const handleBookingClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setBookingDetailOpen(true);
  };

  const handleBookingDetailClose = () => {
    setBookingDetailOpen(false);
    setSelectedBookingId(null);
    // Refresh dashboard data when booking is updated
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <BreakpointLoader size="lg" text="Loading Dashboard..." />
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
          <p className="text-description font-medium mt-1">
            Welcome back! Here's what's happening today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm-enhanced">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{getCurrentTime()}</span>
          </div>
          <Button
            onClick={() => router.push("/admin/bookings/walk-in")}
            className="bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase text-xs h-10 px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Walk-In
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 p-5 cursor-pointer hover:border-green-500/40 transition-all hover:scale-[1.02]"
          onClick={handleRevenueClick}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-stat-label text-green-400 mb-1">
                Today's Revenue
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                ₹{stats?.todaysRevenue?.toLocaleString('en-IN') || 0}
              </h3>
              <p className="text-min-enhanced text-secondary-content">
                From {stats?.todaysBookings || 0} bookings
              </p>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 p-5 cursor-pointer hover:border-blue-500/40 transition-all hover:scale-[1.02]"
          onClick={handleSessionsClick}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-stat-label text-blue-400 mb-1">
                Active Sessions
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                {stats?.activeSessions || 0}
              </h3>
              <p className="text-min-enhanced text-secondary-content">
                Currently playing
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card
          className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 p-5 cursor-pointer hover:border-amber-500/40 transition-all hover:scale-[1.02]"
          onClick={handleUpcomingClick}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-stat-label text-amber-400 mb-1">
                Upcoming
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                {stats?.upcomingBookings || 0}
              </h3>
              <p className="text-min-enhanced text-secondary-content">
                Next 2 hours
              </p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </Card>

        <Card
          className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 border-amber-500/20 p-5 cursor-pointer hover:border-amber-500/40 transition-all hover:scale-[1.02]"
          onClick={handleDevicesClick}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-stat-label text-amber-400 mb-1">
                Available Devices
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                {stats?.availableDevices || 0}
              </h3>
              <p className="text-min-enhanced text-secondary-content">
                Ready to use
              </p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Gamepad2 className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-[var(--surface)] border-[#27272a] p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-stat-label mb-1">
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
              <TrendingUp className="h-5 w-5 text-muted-content" />
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[var(--surface)] border-[#27272a] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-label-enhanced">
              Today's Food Orders
            </p>
            <UtensilsCrossed className="h-4 w-4 text-muted-content" />
          </div>
          <h4 className="text-2xl font-black text-white">
            {quickStats?.todaysFoodOrders || 0}
          </h4>
          <p className="text-min-enhanced text-secondary-content mt-1">
            Active F&B operations
          </p>
        </Card>

        <Card className="bg-[var(--surface)] border-[#27272a] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-label-enhanced">
              Peak Hour Today
            </p>
            <Clock className="h-4 w-4 text-muted-content" />
          </div>
          <h4 className="text-2xl font-black text-white">
            {quickStats?.peakHour || "N/A"}
          </h4>
          <p className="text-min-enhanced text-secondary-content mt-1">
            {quickStats?.peakHourBookings || 0} bookings
          </p>
        </Card>

        <Card className="bg-[var(--surface)] border-[#27272a] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-label-enhanced">
              Quick Actions
            </p>
            <ArrowRight className="h-4 w-4 text-muted-content" />
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => router.push("/admin/bookings")}
              size="sm"
              className="bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black w-full justify-center "
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Bookings
            </Button>
            <Button
              onClick={() => router.push("/admin/reports")}
              size="sm"
              className="w-full justify-center bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="bg-[var(--surface)] border-[#27272a] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-section-header">
              Today's Schedule
            </h3>
            <Button
              onClick={() => router.push("/admin/bookings")}
              variant="ghost"
              size="sm"
              className="text-min-enhanced text-secondary-content hover:text-white"
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
                  className="flex items-center justify-between p-3 bg-[var(--background)] border border-[#27272a] rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-zinc-900 rounded-lg">
                      <span className="text-xs font-black text-primary">
                        {slot.slot_start_time.substring(0, 5)}
                      </span>
                      <span className="text-[8px] text-muted-content">
                        {slot.slot_end_time.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">
                        {slot.bookings?.customer_name || "Unknown"}
                      </p>
                      <p className="text-min-enhanced text-secondary-content">
                        {slot.device_type} - {slot.device_station_number}
                      </p>
                      <p className="text-min text-muted-content mt-0.5">
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
                <p className="text-sm-enhanced">No bookings scheduled for today</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card className="bg-[var(--surface)] border-[#27272a] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-section-header">
              Recent Bookings
            </h3>
            <Button
              onClick={() => router.push("/admin/bookings")}
              variant="ghost"
              size="sm"
              className="text-min-enhanced text-secondary-content hover:text-white"
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
                    className="flex items-center justify-between p-3 bg-[var(--background)] border border-[#27272a] rounded-lg hover:border-zinc-700 transition-colors cursor-pointer"
                    onClick={() => router.push("/admin/bookings")}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">
                          {booking.booking_number}
                        </p>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <p className="text-min-enhanced text-secondary-content">
                        {booking.customer_name} • {booking.customer_phone}
                      </p>
                      {slot && (
                        <p className="text-min text-muted-content mt-1">
                          {slot.device_type} • {new Date(slot.slot_date).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">
                        ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[9px] text-muted-content uppercase mt-0.5">
                        {booking.payment_status}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-zinc-800 mb-3" />
                <p className="text-sm-enhanced">No recent bookings</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-[var(--surface)] border-[#27272a] p-6">
        <h3 className="text-sm font-black uppercase text-muted-content mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-[var(--background)] border border-[#27272a] rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-content">Bookings System</p>
              <p className="text-sm font-bold text-white">Operational</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--background)] border border-[#27272a] rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-content">Payment Gateway</p>
              <p className="text-sm font-bold text-white">Operational</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--background)] border border-[#27272a] rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-content">Food Orders</p>
              <p className="text-sm font-bold text-white">Operational</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--background)] border border-[#27272a] rounded-lg">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-content">Database</p>
              <p className="text-sm font-bold text-white">Connected</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <TodaysRevenueModal
        open={revenueModalOpen}
        onClose={() => setRevenueModalOpen(false)}
        bookings={revenueDetails}
        totalRevenue={stats?.todaysRevenue || 0}
        onBookingClick={handleBookingClick}
      />

      <ActiveSessionsModal
        open={sessionsModalOpen}
        onClose={() => setSessionsModalOpen(false)}
        sessions={sessionsDetails}
        onBookingClick={handleBookingClick}
      />

      <UpcomingBookingsModal
        open={upcomingModalOpen}
        onClose={() => setUpcomingModalOpen(false)}
        bookings={upcomingDetails}
        onBookingClick={handleBookingClick}
      />

      <AvailableDevicesModal
        open={devicesModalOpen}
        onClose={() => setDevicesModalOpen(false)}
        devices={devicesDetails}
      />

      {/* Booking Detail Modal */}
      <BookingDetailModal
        bookingId={selectedBookingId}
        open={bookingDetailOpen}
        onClose={handleBookingDetailClose}
        onUpdate={loadDashboardData}
      />
    </div>
  );
}
