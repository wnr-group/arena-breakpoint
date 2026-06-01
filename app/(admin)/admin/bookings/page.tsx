"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/admin/bookings/BookingStatusBadge";
import { BookingDetailModal } from "@/components/admin/bookings/BookingDetailModal";
import { getAllBookings, getBookingStats, type BookingFilters } from "./actions";
import { Search, Filter, Calendar, DollarSign, Users, CheckCircle2, XCircle, Clock, Loader2, Eye, Receipt } from "lucide-react";
import { toast } from "sonner";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadBookings();
    loadStats();
  }, []);

  const loadBookings = async (filters?: BookingFilters) => {
    setLoading(true);
    const result = await getAllBookings(filters);
    if (result.success) {
      setBookings(result.bookings);
    } else {
      toast.error("Failed to load bookings", { description: result.error });
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await getBookingStats();
    if (result.success) {
      setStats(result.stats);
    }
  };

  const handleFilterChange = (status: string) => {
    setActiveStatusFilter(status);
    loadBookings({
      status: status === "all" ? undefined : status,
      searchQuery: searchQuery || undefined
    });
  };

  const handleSearch = () => {
    loadBookings({
      status: activeStatusFilter === "all" ? undefined : activeStatusFilter,
      searchQuery: searchQuery || undefined
    });
  };

  const filterTabs = [
    { id: "all", label: "All Bookings", count: stats?.total || 0 },
    { id: "confirmed", label: "Confirmed", count: stats?.confirmed || 0 },
    { id: "checked_in", label: "Checked In", count: stats?.checked_in || 0 },
    { id: "completed", label: "Completed", count: stats?.completed || 0 },
    { id: "cancelled", label: "Cancelled", count: stats?.cancelled || 0 }
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">BOOKING MANAGEMENT</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">View and manage all customer bookings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-[#121212] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Total Bookings</p>
              <p className="text-xl font-black text-white">{stats?.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#121212] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Checked In</p>
              <p className="text-xl font-black text-white">{stats?.checked_in || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#121212] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Today's Revenue</p>
              <p className="text-xl font-black text-primary">₹{stats?.todayRevenue?.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#121212] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Completed</p>
              <p className="text-xl font-black text-white">{stats?.completed || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#121212] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Cancelled</p>
              <p className="text-xl font-black text-white">{stats?.cancelled || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto scrollbar-none w-full lg:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`px-4 py-2 text-[11px] font-black uppercase border rounded-lg transition-all whitespace-nowrap ${
                activeStatusFilter === tab.id
                  ? "bg-primary text-black border-transparent"
                  : "bg-[#121212] border-[#27272a] text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-[10px] ${activeStatusFilter === tab.id ? "text-black/70" : "text-zinc-600"}`}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <Input
              placeholder="Search by name, phone, or booking number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 bg-[#121212] border-[#27272a] text-white h-10 text-sm"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-10 px-4"
          >
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="bg-[#121212] border-[#27272a] p-12">
          <div className="text-center space-y-2">
            <Receipt className="h-12 w-12 text-zinc-700 mx-auto" />
            <h3 className="text-lg font-black text-zinc-600 uppercase">No Bookings Found</h3>
            <p className="text-sm text-zinc-600">No bookings match your current filters.</p>
          </div>
        </Card>
      ) : (
        <Card className="bg-[#121212] border-[#27272a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-[#27272a]">
                <tr>
                  <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Booking #
                  </th>
                  <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Device & Date
                  </th>
                  <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Time Slot
                  </th>
                  <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-4 text-right text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {bookings.map((booking) => {
                  const deviceSlot = booking.booking_device_slots?.[0];
                  return (
                    <tr key={booking.id} className="group hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-4 px-4">
                        <p className="text-sm font-black text-primary font-mono">{booking.booking_number}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold text-white">{booking.customer_name}</p>
                        <p className="text-xs text-zinc-500 font-mono">{booking.customer_phone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold text-white">
                          {deviceSlot?.device_type || "N/A"} #{deviceSlot?.device_station_number || "N/A"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {deviceSlot?.slot_date ? new Date(deviceSlot.slot_date).toLocaleDateString() : "N/A"}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-xs text-zinc-400 font-medium">
                          {deviceSlot?.slot_start_time || "N/A"} - {deviceSlot?.slot_end_time || "N/A"}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-black text-white">₹{Number(booking.total_amount).toLocaleString('en-IN')}</p>
                        {booking.food_subtotal > 0 && (
                          <p className="text-[10px] text-zinc-600">+ Food: ₹{Number(booking.food_subtotal).toLocaleString('en-IN')}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <BookingStatusBadge status={booking.status} size="md" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedBooking(booking)}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        bookingId={selectedBooking?.id || null}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdate={() => {
          loadBookings();
          loadStats();
        }}
      />
    </div>
  );
}
