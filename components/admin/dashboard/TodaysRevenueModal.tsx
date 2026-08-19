"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IndianRupee, TrendingUp, ReceiptIndianRupee, Calendar, Eye, EyeOff } from "lucide-react";
import { BookingStatusBadge } from "@/components/admin/bookings/BookingStatusBadge";
import { formatDbTimeRange } from "@/lib/utils/timeSlots";

interface TodaysRevenueModalProps {
  open: boolean;
  onClose: () => void;
  bookings: any[];
  totalRevenue: number;
  onBookingClick: (bookingId: string) => void;
}

export function TodaysRevenueModal({ open, onClose, bookings, totalRevenue, onBookingClick }: TodaysRevenueModalProps) {
  /**
   * Every figure in here is takings, and the dashboard behind it sits on a
   * screen at the front desk. One switch covers the lot - masking each number
   * separately would mean a dozen presses to read a breakdown.
   */
  const [revealed, setRevealed] = useState(false);

  // Re-mask on close, so the next open starts covered like the card does.
  useEffect(() => {
    if (!open) setRevealed(false);
  }, [open]);

  const money = (amount: number) =>
    revealed ? `₹${amount.toLocaleString('en-IN')}` : "₹ ••••";

  // Calculate device and food revenue based on actual amount paid
  let deviceRevenue = 0;
  let foodRevenue = 0;

  bookings.forEach(b => {
    const amountPaid = Number(b.amount_paid || 0);
    const deviceSubtotal = Number(b.device_subtotal || 0);
    const foodSubtotal = Number(b.food_subtotal || 0);
    const subscriptionDiscount = Number(b.subscription_discount || 0);
    const promoDiscount = Number(b.promo_discount || 0);
    const happyHourDiscount = Number(b.happy_hour_discount || 0);
    const totalDiscount = subscriptionDiscount + promoDiscount + happyHourDiscount;

    // Discounts apply only to device revenue
    const deviceAfterDiscount = Math.max(0, deviceSubtotal - totalDiscount);

    if (b.payment_status === 'partial') {
      // For partial: amount_paid covers device first, then food
      deviceRevenue += Math.min(amountPaid, deviceAfterDiscount);
      foodRevenue += Math.max(0, amountPaid - deviceAfterDiscount);
    } else {
      // Fully paid
      const expectedTotal = deviceAfterDiscount + foodSubtotal;
      if (expectedTotal > 0) {
        // Proportional split
        deviceRevenue += (deviceAfterDiscount / expectedTotal) * amountPaid;
        foodRevenue += (foodSubtotal / expectedTotal) * amountPaid;
      } else {
        deviceRevenue += amountPaid;
      }
    }
  });

  const paidAmount = bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.amount_paid || 0), 0);
  const partialAmount = bookings.filter(b => b.payment_status === 'partial').reduce((sum, b) => sum + Number(b.amount_paid || 0), 0);
  const cashRevenue = bookings.reduce((sum, b) => sum + Number(b.cash_amount || 0), 0);
  const cardRevenue = bookings.reduce((sum, b) => sum + Number(b.card_amount || 0), 0);
  const upiRevenue = bookings.reduce((sum, b) => sum + Number(b.upi_amount || 0), 0);
  const onlineRevenue = bookings.reduce((sum, b) => sum + Number(b.online_amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--background)] border-primary/30 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle className="text-xl font-black uppercase text-white flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-500" />
              Today's Revenue
            </DialogTitle>
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-pressed={revealed}
              aria-label={revealed ? "Hide amounts" : "Show amounts"}
              title={revealed ? "Hide amounts" : "Show amounts"}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#27272a] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-black uppercase text-muted-content transition-colors hover:text-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {revealed ? "Hide" : "Show"}
            </button>
          </div>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-white">{money(totalRevenue)}</p>
            <p className="text-label mt-1">{bookings.length} bookings</p>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-[#27272a] rounded-lg">
            <p className="text-xs text-muted-content mb-1">Payment Status</p>
            <p className="text-2xl font-black text-primary">{money(paidAmount)}</p>
            <p className="text-label mt-1">
              {bookings.filter(b => b.payment_status === 'paid').length} paid
              {partialAmount > 0 && ` • ${money(partialAmount)} partial`}
            </p>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-[#27272a] rounded-lg">
            <p className="text-xs text-muted-content mb-1">Device Revenue</p>
            <p className="text-lg font-black text-white">{money(deviceRevenue)}</p>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-[#27272a] rounded-lg">
            <p className="text-xs text-muted-content mb-1">Food Revenue</p>
            <p className="text-lg font-black text-white">{money(foodRevenue)}</p>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-[var(--surface)] border border-[#27272a] p-4 rounded-lg mb-4 space-y-3">
          <h5 className="text-xs font-black uppercase text-muted-content tracking-wider flex items-center gap-1.5">
            Payment Methods
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 bg-[var(--background)] border border-[#27272a] rounded-lg text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span className="text-lg">💵</span>
                <p className="text-xs font-black uppercase text-white">Cash</p>
              </div>
              <p className="text-sm font-black text-green-400">{money(cashRevenue)}</p>
            </div>
            <div className="p-3 bg-[var(--background)] border border-[#27272a] rounded-lg text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span className="text-lg">💳</span>
                <p className="text-xs font-black uppercase text-white">Card</p>
              </div>
              <p className="text-sm font-black text-blue-400">{money(cardRevenue)}</p>
            </div>
            <div className="p-3 bg-[var(--background)] border border-[#27272a] rounded-lg text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span className="text-lg">📱</span>
                <p className="text-xs font-black uppercase text-white">UPI</p>
              </div>
              <p className="text-sm font-black text-purple-400">{money(upiRevenue)}</p>
            </div>
            <div className="p-3 bg-[var(--background)] border border-[#27272a] rounded-lg text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span className="text-lg">🌐</span>
                <p className="text-xs font-black uppercase text-white">Online</p>
              </div>
              <p className="text-sm font-black text-amber-400">{money(onlineRevenue)}</p>
            </div>
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
                        {slot?.device_type} • {formatDbTimeRange(slot?.slot_start_time, slot?.slot_end_time)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">{money(Number(booking.amount_paid || 0))}</p>
                      <p className={`text-[11px] uppercase mt-1 ${booking.payment_status === 'paid' ? 'text-green-500' : booking.payment_status === 'partial' ? 'text-blue-500' : 'text-amber-500'}`}>
                        {booking.payment_status}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <ReceiptIndianRupee className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-muted-content">No bookings today</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
