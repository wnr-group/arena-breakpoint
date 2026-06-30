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
          const isMultipleBookings = group.count > 1;

          return (
            <Card
              key={booking.id}
              className="bg-[var(--surface)] border-[#27272a] hover:border-primary/50 transition-all overflow-hidden group"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-br from-[var(--background)] to-[var(--surface)] border-b border-[#27272a]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-black text-primary font-mono">{booking.booking_number}</p>
                    <p className="text-label mt-0.5">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} size="sm" />
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-3.5 w-3.5 text-secondary-content" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{group.customerName}</p>
                    <p className="text-xs text-secondary-content font-mono">{group.phone}</p>
                  </div>
                  {isMultipleBookings && (
                    <span className="bg-gradient-primary text-black text-[8px] font-black px-2 py-0.5 rounded-full">
                      ×{group.count}
                    </span>
                  )}
                  {group.hasBackToBack && (
                    <span className="bg-gradient-secondary text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                      <Link2 className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-3">
                {/* Device Info */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-secondary-content mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">
                      {deviceSlot?.device_type || "N/A"}
                    </p>
                    <p className="text-label">
                      Station #{deviceSlot?.device_station_number || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-start gap-2">
                  <Calendar className="h-3.5 w-3.5 text-secondary-content mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">
                      {deviceSlot?.slot_date ? new Date(deviceSlot.slot_date).toLocaleDateString() : "N/A"}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-content" />
                      <p className="text-label">
                        {deviceSlot?.slot_start_time || "N/A"} - {deviceSlot?.slot_end_time || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-start gap-2 pt-2 border-t border-[#27272a]">
                  <DollarSign className="h-3.5 w-3.5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-black text-primary">
                      ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-label">
                        Games: ₹{Number(booking.device_subtotal || 0).toLocaleString('en-IN')}
                      </p>
                      {booking.food_subtotal > 0 && (
                        <p className="text-label">
                          Food: ₹{Number(booking.food_subtotal).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                  <PaymentStatusBadge status={booking.payment_status || 'pending'} size="sm" />
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 bg-[var(--background)] border-t border-[#27272a] flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {booking.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCheckIn(booking.id, booking.booking_number)}
                      disabled={isPending}
                      className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      title="Check In"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {booking.status === "checked_in" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCheckOut(booking.id, booking.booking_number)}
                      disabled={isPending}
                      className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      title="Check Out"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {(booking.status === "confirmed" || booking.status === "checked_in") && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddFood(booking)}
                        className="h-7 w-7 p-0 text-primary hover:text-primary-hover hover:bg-primary/10"
                        title="Add Food"
                      >
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCheckoutBilling(booking.id)}
                        className="h-7 w-7 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                        title="Checkout & Billing"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onBookingClick(booking)}
                  className="h-7 px-3 text-muted-content hover:text-white text-[10px] font-black uppercase"
                  title="View Details"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Details
                </Button>
              </div>
            </Card>
          );
        });
      })}
    </div>
  );
}
