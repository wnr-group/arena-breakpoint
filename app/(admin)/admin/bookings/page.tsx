"use client";

import { useState, useEffect, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/admin/bookings/BookingStatusBadge";
import { BookingDetailModal } from "@/components/admin/bookings/BookingDetailModal";
import { BookingsTimeline } from "@/components/admin/bookings/BookingsTimeline";
import { getAllBookings, getBookingStats, checkInBooking, checkOutBooking, getTimelineBookings, type BookingFilters } from "./actions";
import { Search, Filter, Calendar, DollarSign, Users, CheckCircle2, XCircle, Clock, Loader2, Eye, Receipt, Plus, UserCheck, LogOut, UtensilsCrossed, ChevronDown, ChevronRight, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [openFoodModal, setOpenFoodModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  const [timelineDate, setTimelineDate] = useState(new Date());
  const [timelineBookings, setTimelineBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
    loadStats();
    loadTimelineBookings();
  }, []);

  useEffect(() => {
    loadTimelineBookings();
  }, [timelineDate]);

  const loadTimelineBookings = async () => {
    setLoading(true);
    const dateStr = timelineDate.toISOString().split('T')[0];
    const result = await getTimelineBookings(dateStr);
    if (result.success) {
      setTimelineBookings(result.bookings);
    } else {
      toast.error("Failed to load timeline", { description: result.error });
    }
    setLoading(false);
  };

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

  const handleCheckIn = async (bookingId: string, bookingNumber: string) => {
    startTransition(async () => {
      const result = await checkInBooking(bookingId);
      if (result.success) {
        toast.success("Customer checked in successfully", {
          description: `Booking ${bookingNumber} is now active`
        });
        loadBookings();
        loadStats();
      } else {
        toast.error("Check-in failed", { description: result.error });
      }
    });
  };

  const handleCheckOut = async (bookingId: string, bookingNumber: string) => {
    startTransition(async () => {
      const result = await checkOutBooking(bookingId);
      if (result.success) {
        toast.success("Customer checked out successfully", {
          description: `Booking ${bookingNumber} is now completed`
        });
        loadBookings();
        loadStats();
      } else {
        toast.error("Check-out failed", { description: result.error });
      }
    });
  };

  const filterTabs = [
    { id: "all", label: "All Bookings", count: stats?.total || 0 },
    { id: "confirmed", label: "Confirmed", count: stats?.confirmed || 0 },
    { id: "checked_in", label: "Checked In", count: stats?.checked_in || 0 },
    { id: "completed", label: "Completed", count: stats?.completed || 0 },
    { id: "cancelled", label: "Cancelled", count: stats?.cancelled || 0 }
  ];

  // Group bookings by customer
  const groupedBookings = bookings.reduce((groups, booking) => {
    const key = booking.customer_phone;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(booking);
    return groups;
  }, {} as Record<string, any[]>);

  // Sort each group by date/time and calculate stats
  const customerGroups = Object.entries(groupedBookings).map(([phone, customerBookings]) => {
    const sorted = customerBookings.sort((a, b) => {
      const slotA = a.booking_device_slots?.[0];
      const slotB = b.booking_device_slots?.[0];
      const dateA = slotA?.slot_date || a.created_at;
      const dateB = slotB?.slot_date || b.created_at;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    const totalAmount = sorted.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const totalDevice = sorted.reduce((sum, b) => sum + Number(b.device_subtotal || 0), 0);
    const totalFood = sorted.reduce((sum, b) => sum + Number(b.food_subtotal || 0), 0);

    // Check for back-to-back bookings
    let hasBackToBack = false;
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentSlot = sorted[i].booking_device_slots?.[0];
      const nextSlot = sorted[i + 1].booking_device_slots?.[0];

      if (currentSlot && nextSlot) {
        const currentDate = currentSlot.slot_date;
        const nextDate = nextSlot.slot_date;
        const currentEnd = currentSlot.slot_end_time;
        const nextStart = nextSlot.slot_start_time;

        if (currentDate === nextDate && currentEnd === nextStart) {
          hasBackToBack = true;
          break;
        }
      }
    }

    return {
      phone,
      customerName: sorted[0].customer_name,
      bookings: sorted,
      count: sorted.length,
      totalAmount,
      totalDevice,
      totalFood,
      hasBackToBack,
      earliestBooking: sorted[0]
    };
  });

  const toggleCustomerExpansion = (phone: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(phone)) {
        next.delete(phone);
      } else {
        next.add(phone);
      }
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">BOOKING MANAGEMENT</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">View and manage all customer bookings</p>
        </div>
        <Button
          onClick={() => router.push("/admin/bookings/walk-in")}
          className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-10 px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Walk-In Booking
        </Button>
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

      {/* Timeline View - Always Visible */}
      <BookingsTimeline
        bookings={timelineBookings}
        selectedDate={timelineDate}
        onDateChange={setTimelineDate}
        onBookingClick={setSelectedBooking}
      />

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
                    Device
                  </th>
                  <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                    Date & Time
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
                {customerGroups.map((group) => {
                  const isExpanded = expandedCustomers.has(group.phone);
                  const isSingleBooking = group.count === 1;
                  const firstBooking = group.earliestBooking;
                  const firstSlot = firstBooking.booking_device_slots?.[0];

                  return (
                    <Fragment key={`group-${group.phone}`}>
                      {/* Parent Row - Customer Summary */}
                      <tr className="group hover:bg-[#1a1a1a] transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {!isSingleBooking && (
                              <button
                                onClick={() => toggleCustomerExpansion(group.phone)}
                                className="text-zinc-500 hover:text-primary transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <div>
                              <p className="text-sm font-black text-primary font-mono">
                                {isSingleBooking ? firstBooking.booking_number : `${group.count} Bookings`}
                              </p>
                              <p className="text-[11px] text-data-visible mt-0.5">
                                {new Date(firstBooking.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm font-bold text-data-visible">{group.customerName}</p>
                              <p className="text-xs text-data-placeholder font-mono">{group.phone}</p>
                            </div>
                            {!isSingleBooking && (
                              <span className="bg-gradient-primary text-black text-[8px] font-black px-2 py-0.5 rounded-full">
                                ×{group.count}
                              </span>
                            )}
                            {group.hasBackToBack && (
                              <span className="bg-gradient-secondary text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Link2 className="h-2.5 w-2.5" />
                                B2B
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {isSingleBooking ? (
                            <>
                              <p className="text-sm font-bold text-data-visible">
                                {firstSlot?.device_type || "N/A"}
                              </p>
                              <p className="text-xs text-data-placeholder">
                                Station #{firstSlot?.device_station_number || "N/A"}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-data-placeholder">Multiple devices</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {isSingleBooking ? (
                            <>
                              <p className="text-sm font-bold text-data-visible">
                                {firstSlot?.slot_date ? new Date(firstSlot.slot_date).toLocaleDateString() : "N/A"}
                              </p>
                              <p className="text-xs text-data-placeholder">
                                {firstSlot?.slot_start_time || "N/A"} - {firstSlot?.slot_end_time || "N/A"}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-data-placeholder italic">Multiple slots</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-black text-date-visible">₹{group.totalAmount.toLocaleString('en-IN')}</p>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-[10.5px] text-data-placeholder">
                              Games: ₹{group.totalDevice.toLocaleString('en-IN')}
                            </p>
                            {group.totalFood > 0 && (
                              <p className="text-[10.5px] text-data-placeholder">
                                Food: ₹{group.totalFood.toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {isSingleBooking ? (
                            <BookingStatusBadge status={firstBooking.status} size="md" />
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(group.bookings.map(b => b.status))).map(status => (
                                <BookingStatusBadge key={status} status={status} size="sm" />
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {isSingleBooking && (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {firstBooking.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCheckIn(firstBooking.id, firstBooking.booking_number)}
                                  disabled={isPending}
                                  className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  title="Check In"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                              {firstBooking.status === "checked_in" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCheckOut(firstBooking.id, firstBooking.booking_number)}
                                  disabled={isPending}
                                  className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  title="Check Out"
                                >
                                  <LogOut className="h-4 w-4" />
                                </Button>
                              )}
                              {(firstBooking.status === "confirmed" || firstBooking.status === "checked_in") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedBooking(firstBooking);
                                    setOpenFoodModal(true);
                                  }}
                                  className="h-8 w-8 p-0 text-primary hover:text-primary-hover hover:bg-primary/10"
                                  title="Add Food"
                                >
                                  <UtensilsCrossed className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedBooking(firstBooking)}
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Child Rows - Individual Bookings (when expanded) */}
                      {!isSingleBooking && isExpanded && group.bookings.map((booking, index) => {
                        const deviceSlot = booking.booking_device_slots?.[0];
                        return (
                          <tr key={booking.id} className="bg-[#0a0a0a] hover:bg-[#121212] transition-colors border-l-4 border-l-primary/30">
                            <td className="py-3 px-4 pl-12">
                              <p className="text-sm font-black text-primary font-mono">{booking.booking_number}</p>
                              <p className="text-[10px] text-data-placeholder mt-0.5">
                                Booking #{index + 1}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-xs text-data-placeholder">Same customer</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm font-bold text-date-visible">
                                {deviceSlot?.device_type || "N/A"}
                              </p>
                              <p className="text-xs text-data-placeholder">
                                Station #{deviceSlot?.device_station_number || "N/A"}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm font-bold text-date-visible">
                                {deviceSlot?.slot_date ? new Date(deviceSlot.slot_date).toLocaleDateString() : "N/A"}
                              </p>
                              <p className="text-xs text-data-placeholder">
                                {deviceSlot?.slot_start_time || "N/A"} - {deviceSlot?.slot_end_time || "N/A"}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm font-black text-data-visible">₹{Number(booking.total_amount).toLocaleString('en-IN')}</p>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <p className="text-[10.5px] text-data-placeholder">
                                  Games: ₹{Number(booking.device_subtotal || 0).toLocaleString('en-IN')}
                                </p>
                                {booking.food_subtotal > 0 && (
                                  <p className="text-[10.5px] text-data-placeholder">
                                    Food: ₹{Number(booking.food_subtotal).toLocaleString('en-IN')}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <BookingStatusBadge status={booking.status} size="md" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2 opacity-0 hover:opacity-100 transition-opacity">
                                {booking.status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCheckIn(booking.id, booking.booking_number)}
                                    disabled={isPending}
                                    className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                    title="Check In"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                )}
                                {booking.status === "checked_in" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCheckOut(booking.id, booking.booking_number)}
                                    disabled={isPending}
                                    className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                    title="Check Out"
                                  >
                                    <LogOut className="h-4 w-4" />
                                  </Button>
                                )}
                                {(booking.status === "confirmed" || booking.status === "checked_in") && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setOpenFoodModal(true);
                                    }}
                                    className="h-8 w-8 p-0 text-primary hover:text-primary-hover hover:bg-primary/10"
                                    title="Add Food"
                                  >
                                    <UtensilsCrossed className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
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
        onClose={() => {
          setSelectedBooking(null);
          setOpenFoodModal(false);
        }}
        onUpdate={() => {
          loadBookings();
          loadStats();
          loadTimelineBookings();
        }}
        openFoodModalDirectly={openFoodModal}
      />
    </div>
  );
}
