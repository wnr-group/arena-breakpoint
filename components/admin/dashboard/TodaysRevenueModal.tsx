"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, Receipt, Calendar } from "lucide-react";
import { BookingStatusBadge } from "@/components/admin/bookings/BookingStatusBadge";

interface TodaysRevenueModalProps {
  open: boolean;
  onClose: () => void;
  bookings: any[];
  totalRevenue: number;
  onBookingClick: (bookingId: string) => void;
}

export function TodaysRevenueModal({ open, onClose, bookings, totalRevenue, onBookingClick }: TodaysRevenueModalProps) {
  const deviceRevenue = bookings.reduce((sum, b) => sum + Number(b.device_subtotal || 0), 0);
  const foodRevenue = bookings.reduce((sum, b) => sum + Number(b.food_subtotal || 0), 0);
  const paidAmount = bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const pendingAmount = bookings.filter(b => b.payment_status === 'pending').reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--background)] border-primary/30 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Today's Revenue
          </DialogTitle>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-label mt-1">{bookings.length} bookings</p>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-[#27272a] rounded-lg">
            <p className="text-xs text-muted-content mb-1">Paid</p>
            <p className="text-2xl font-black text-primary">₹{paidAmount.toLocaleString('en-IN')}</p>
            <p className="text-label mt-1">{bookings.filter(b => b.payment_status === 'paid').length} bookings</p>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-[#27272a] rounded-lg">
            <p className="text-xs text-muted-content mb-1">Device Revenue</p>
            <p className="text-lg font-black text-white">₹{deviceRevenue.toLocaleString('en-IN')}</p>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-[#27272a] rounded-lg">
            <p className="text-xs text-muted-content mb-1">Food Revenue</p>
            <p className="text-lg font-black text-white">₹{foodRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-2">
          <h4 className="text-sm font-black uppercase text-muted-content mb-3">Today's Bookings</h4>
          {bookings.length > 0 ? (
            bookings.map((booking) => {
              const slot = booking.booking_device_slots?.[0];
              return (
                <div
                  key={booking.id}
                  className="p-3 bg-[var(--surface)] border border-[#27272a] rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => onBookingClick(booking.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-primary font-mono">{booking.booking_number}</p>
                        <BookingStatusBadge status={booking.status} size="sm" />
                      </div>
                      <p className="text-xs text-white">{booking.customer_name}</p>
                      <p className="text-label mt-1">
                        {slot?.device_type} • {slot?.slot_start_time?.substring(0, 5)} - {slot?.slot_end_time?.substring(0, 5)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">₹{Number(booking.total_amount).toLocaleString('en-IN')}</p>
                      <p className={`text-[9px] uppercase mt-1 ${booking.payment_status === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
                        {booking.payment_status}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-muted-content">No bookings today</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
