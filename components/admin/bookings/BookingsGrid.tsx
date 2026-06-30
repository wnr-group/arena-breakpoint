"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { Calendar, Clock, MapPin, DollarSign, Phone, User, Eye, UserCheck, LogOut, UtensilsCrossed, CreditCard, Link2 } from "lucide-react";

interface BookingsGridProps {
  customerGroups: Array<{
    phone: string;
    customerName: string;
    bookings: any[];
    count: number;
    totalAmount: number;
    totalDevice: number;
    totalFood: number;
    hasBackToBack: boolean;
    earliestBooking: any;
  }>;
  onBookingClick: (booking: any) => void;
  onCheckIn: (bookingId: string, bookingNumber: string) => void;
  onCheckOut: (bookingId: string, bookingNumber: string) => void;
  onAddFood: (booking: any) => void;
  onCheckoutBilling: (bookingId: string) => void;
  isPending: boolean;
}

export function BookingsGrid({
  customerGroups,
  onBookingClick,
  onCheckIn,
  onCheckOut,
  onAddFood,
  onCheckoutBilling,
  isPending
}: BookingsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customerGroups.flatMap((group) => {
        return group.bookings.map((booking) => {
          const deviceSlot = booking.booking_device_slots?.[0];

          return (
            <Card
              key={booking.id}
              className="bg-[var(--surface)] border-[#27272a] hover:border-primary/40 transition-all overflow-hidden group hover:shadow-[0_0_20px_rgba(255,193,7,0.1)]"
            >
              {/* Header - Booking ID & Status */}
              <div className="p-4 bg-gradient-to-br from-[var(--background)] to-[var(--surface)] border-b border-[#27272a]/50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-mono text-primary/70">{booking.booking_number}</p>
                  <BookingStatusBadge status={booking.status} size="sm" />
                </div>

                {/* Customer Name - Big */}
                <h3 className="text-lg font-black text-white mb-1 truncate group-hover:text-primary transition-colors">
                  {group.customerName}
                </h3>
                <p className="text-xs text-muted-content font-mono">{group.phone}</p>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Device Type Only */}
                <div className="flex items-center gap-2 p-2 bg-[var(--background)] rounded-lg border border-[#27272a]/50">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-content">Device</p>
                    <p className="text-sm font-bold text-white">{deviceSlot?.device_type || "N/A"}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-2 p-2 bg-[var(--background)] rounded-lg border border-[#27272a]/50">
                  <div className="p-1.5 bg-blue-500/10 rounded">
                    <Calendar className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-content">Date & Time</p>
                    <p className="text-sm font-bold text-white">
                      {deviceSlot?.slot_date ? new Date(deviceSlot.slot_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : "N/A"}
                    </p>
                    <p className="text-[10px] text-muted-content flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {deviceSlot?.slot_start_time || "N/A"} - {deviceSlot?.slot_end_time || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <div className="p-1.5 bg-primary/20 rounded">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-primary/70">Total Amount</p>
                    <p className="text-lg font-black text-primary">
                      ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <PaymentStatusBadge status={booking.payment_status || 'pending'} size="sm" />
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 bg-[var(--background)]/50 border-t border-[#27272a]/50 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {booking.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCheckIn(booking.id, booking.booking_number)}
                      disabled={isPending}
                      className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg"
                      title="Check In"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  )}
                  {booking.status === "checked_in" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCheckOut(booking.id, booking.booking_number)}
                      disabled={isPending}
                      className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg"
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
                        onClick={() => onAddFood(booking)}
                        className="h-8 w-8 p-0 text-primary hover:text-primary-hover hover:bg-primary/10 rounded-lg"
                        title="Add Food"
                      >
                        <UtensilsCrossed className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCheckoutBilling(booking.id)}
                        className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg"
                        title="Checkout & Billing"
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => onBookingClick(booking)}
                  className="h-8 px-3 bg-[var(--surface)] hover:bg-primary/10 border border-[#27272a] hover:border-primary/50 text-white hover:text-primary text-[10px] font-black uppercase rounded-lg transition-all"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
              </div>
            </Card>
          );
        });
      })}
    </div>
  );
}
