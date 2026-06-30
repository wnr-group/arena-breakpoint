"use client";

import { useState, useEffect, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/admin/bookings/BookingStatusBadge";
import { PaymentStatusBadge } from "@/components/admin/bookings/PaymentStatusBadge";
import { BookingsGrid } from "@/components/admin/bookings/BookingsGrid";
import { BookingDetailModal } from "@/components/admin/bookings/BookingDetailModal";
import { CheckoutModal } from "@/components/admin/bookings/CheckoutModal";
import { getAllBookings, getBookingStats, checkInBooking, checkOutBooking, type BookingFilters } from "./actions";
import { BreakpointLoader } from "@/components/shared/BreakpointLoader";
import { Search, Filter, Calendar, DollarSign, Users, CheckCircle2, XCircle, Clock, Loader2, Eye, Receipt, Plus, UserCheck, LogOut, UtensilsCrossed, ChevronDown, ChevronRight, Link2, CreditCard, Grid3x3, List } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/lib/hooks/useDebounce";

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300); // Debounce search by 300ms
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [openFoodModal, setOpenFoodModal] = useState(false);
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);
  const [openCheckoutModal, setOpenCheckoutModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Initial load
  useEffect(() => {
    loadBookings();
    loadStats();
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearch || debouncedSearch === "") {
      loadBookings({
        status: activeStatusFilter === "all" ? undefined : activeStatusFilter,
        searchQuery: debouncedSearch || undefined
      });
    }
  }, [debouncedSearch, activeStatusFilter]);

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
    // loadBookings will be triggered automatically by useEffect watching activeStatusFilter
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
    const sorted = (customerBookings as any[]).sort((a, b) => {
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
          <p className="text-description font-medium mt-1">View and manage all customer bookings</p>
        </div>
        <Button
          onClick={() => router.push("/admin/bookings/walk-in")}
          className="bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase text-xs h-10 px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Walk-In Booking
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-[var(--surface)] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-label text-muted-content">Total Bookings</p>
              <p className="text-xl font-black text-white">{stats?.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[var(--surface)] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-label text-muted-content">Checked In</p>
              <p className="text-xl font-black text-white">{stats?.checked_in || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[var(--surface)] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-label text-muted-content">Today's Revenue</p>
              <p className="text-xl font-black text-primary">₹{stats?.todayRevenue?.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[var(--surface)] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-label text-muted-content">Completed</p>
              <p className="text-xl font-black text-white">{stats?.completed || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[var(--surface)] border-[#27272a] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-label text-muted-content">Cancelled</p>
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
              className={`px-4 py-2 text-min font-black uppercase border rounded-lg transition-all whitespace-nowrap ${
                activeStatusFilter === tab.id
                  ? "bg-primary text-black border-transparent"
                  : "bg-[var(--surface)] border-[#27272a] text-secondary-content hover:border-zinc-700"
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-min ${activeStatusFilter === tab.id ? "text-black/70" : "text-secondary-content"}`}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-[var(--surface)] border border-[#27272a] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-black"
                  : "text-secondary-content hover:text-white"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-primary text-black"
                  : "text-secondary-content hover:text-white"
              }`}
              title="Grid View"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-content" />
            <Input
              placeholder="Search by name, phone, or booking number... (auto-search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[var(--surface)] border-[#27272a] text-white h-10 text-sm"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Bookings List/Grid */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <BreakpointLoader size="lg" text="Loading Bookings..." />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="bg-[var(--surface)] border-[#27272a] p-12">
          <div className="text-center space-y-2">
            <Receipt className="h-12 w-12 text-zinc-700 mx-auto" />
            <h3 className="text-lg font-black text-muted-content uppercase">No Bookings Found</h3>
            <p className="text-sm text-muted-content">No bookings match your current filters.</p>
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        <BookingsGrid
          customerGroups={customerGroups}
          onBookingClick={(booking) => setSelectedBooking(booking)}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onAddFood={(booking) => {
            setSelectedBooking(booking);
            setOpenFoodModal(true);
          }}
          onCheckoutBilling={(bookingId) => {
            setCheckoutBookingId(bookingId);
            setOpenCheckoutModal(true);
          }}
          isPending={isPending}
        />
      ) : (
        <Card className="bg-[var(--surface)] border-[#27272a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background)] border-b border-[#27272a]">
                <tr>
                  <th className="py-4 px-4 text-left text-label text-muted-content">
                    Booking #
                  </th>
                  <th className="py-4 px-4 text-left text-label text-muted-content">
                    Customer
                  </th>
                  <th className="py-4 px-4 text-left text-label text-muted-content">
                    Device
                  </th>
                  <th className="py-4 px-4 text-left text-label text-muted-content">
                    Date & Time
                  </th>
                  <th className="py-4 px-4 text-left text-label text-muted-content">
                    Amount
                  </th>
                  <th className="py-4 px-4 text-left text-label text-muted-content">
                    Payment
                  </th>
                  <th className="py-4 px-4 text-left text-label text-muted-content">
                    Status
                  </th>
                  <th className="py-4 px-4 text-right text-label text-muted-content">
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
                      <tr
                        className={`group hover:bg-[var(--surface-hover)] transition-colors ${!isSingleBooking ? 'cursor-pointer' : ''}`}
                        onClick={() => !isSingleBooking && toggleCustomerExpansion(group.phone)}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {!isSingleBooking && (
                              <button
                                onClick={() => toggleCustomerExpansion(group.phone)}
                                className="text-secondary-content hover:text-primary transition-colors"
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
                              <p className="text-min text-secondary-content mt-0.5">
                                {new Date(firstBooking.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm font-bold text-data-visible">{group.customerName}</p>
                              <p className="text-sm-readable text-secondary-content font-mono">{group.phone}</p>
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
                              <p className="text-sm-readable text-secondary-content">
                                Station #{firstSlot?.device_station_number || "N/A"}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm-readable text-secondary-content">Multiple devices</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {isSingleBooking ? (
                            <>
                              <p className="text-sm font-bold text-data-visible">
                                {firstSlot?.slot_date ? new Date(firstSlot.slot_date).toLocaleDateString() : "N/A"}
                              </p>
                              <p className="text-sm-readable text-secondary-content">
                                {firstSlot?.slot_start_time || "N/A"} - {firstSlot?.slot_end_time || "N/A"}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm-readable text-secondary-content italic">Multiple slots</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-black text-date-visible">₹{group.totalAmount.toLocaleString('en-IN')}</p>
                          {isSingleBooking && (
                            <div className="flex flex-col gap-0.5 mt-1">
                              <p className="text-min text-secondary-content">
                                Games: ₹{group.totalDevice.toLocaleString('en-IN')}
                              </p>
                              {group.totalFood > 0 && (
                                <p className="text-min text-secondary-content">
                                  Food: ₹{group.totalFood.toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {isSingleBooking ? (
                            <PaymentStatusBadge status={firstBooking.payment_status || 'pending'} size="md" />
                          ) : (
                            <p className="text-sm-readable text-secondary-content italic">-</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {isSingleBooking ? (
                            <BookingStatusBadge status={firstBooking.status} size="md" />
                          ) : (
                            <p className="text-sm-readable text-secondary-content italic">-</p>
                          )}
                        </td>
                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                          {isSingleBooking && (
                            <div className="flex justify-end gap-2">
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
                                <>
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
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setCheckoutBookingId(firstBooking.id);
                                      setOpenCheckoutModal(true);
                                    }}
                                    className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                    title="Checkout & Billing"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedBooking(firstBooking)}
                                className="h-8 w-8 p-0 text-muted-content hover:text-white"
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
                          <tr key={booking.id} className="bg-[var(--background)] hover:bg-[var(--surface)] transition-colors border-l-4 border-l-primary/30">
                            <td className="py-3 px-4 pl-12">
                              <p className="text-sm font-black text-primary font-mono">{booking.booking_number}</p>
                              <p className="text-min text-secondary-content mt-0.5">
                                Booking #{index + 1}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm-readable text-secondary-content">Same customer</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm font-bold text-date-visible">
                                {deviceSlot?.device_type || "N/A"}
                              </p>
                              <p className="text-sm-readable text-secondary-content">
                                Station #{deviceSlot?.device_station_number || "N/A"}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm font-bold text-date-visible">
                                {deviceSlot?.slot_date ? new Date(deviceSlot.slot_date).toLocaleDateString() : "N/A"}
                              </p>
                              <p className="text-sm-readable text-secondary-content">
                                {deviceSlot?.slot_start_time || "N/A"} - {deviceSlot?.slot_end_time || "N/A"}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm font-black text-data-visible">₹{Number(booking.total_amount).toLocaleString('en-IN')}</p>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <p className="text-min text-secondary-content">
                                  Games: ₹{Number(booking.device_subtotal || 0).toLocaleString('en-IN')}
                                </p>
                                {booking.food_subtotal > 0 && (
                                  <p className="text-min text-secondary-content">
                                    Food: ₹{Number(booking.food_subtotal).toLocaleString('en-IN')}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <PaymentStatusBadge status={booking.payment_status || 'pending'} size="md" />
                            </td>
                            <td className="py-3 px-4">
                              <BookingStatusBadge status={booking.status} size="md" />
                            </td>
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
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
                                  <>
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
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setCheckoutBookingId(booking.id);
                                        setOpenCheckoutModal(true);
                                      }}
                                      className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                      title="Checkout & Billing"
                                    >
                                      <CreditCard className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="h-8 w-8 p-0 text-muted-content hover:text-white"
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
        }}
        openFoodModalDirectly={openFoodModal}
      />

      {/* Checkout & Billing Modal */}
      <CheckoutModal
        bookingId={checkoutBookingId}
        isOpen={openCheckoutModal}
        onClose={() => {
          setOpenCheckoutModal(false);
          setCheckoutBookingId(null);
        }}
        onSuccess={() => {
          loadBookings();
          loadStats();
        }}
      />
    </div>
  );
}
