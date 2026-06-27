"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, UtensilsCrossed, ArrowLeft, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getBookingById } from "../actions";
import { toast } from "sonner";

function BookingDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.bookingId as string;
  const phone = searchParams.get("phone");

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    if (!bookingId) return;

    setIsLoading(true);
    const result = await getBookingById(bookingId);

    if (result.success && result.booking) {
      setBooking(result.booking);
    } else {
      toast.error("Error", { description: "Failed to load booking details." });
      router.push(`/my-bookings${phone ? `?phone=${phone}` : ""}`);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 max-w-2xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.push(`/my-bookings${phone ? `?phone=${phone}` : ""}`)}
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Bookings
        </Button>
      </div>

      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black uppercase text-white tracking-tight">Booking Details</h1>
        <p className="text-xs text-zinc-500 font-mono">{booking.booking_number}</p>
      </div>

      {/* QR Code */}
      <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl glow-box-strong">
        <div className="flex items-center justify-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">
          <QrCode className="h-4 w-4" />
          <span>Booking QR Code</span>
        </div>
        <div className="flex justify-center bg-white p-6 rounded-lg">
          <QRCodeSVG value={booking.booking_number} size={200} level="H" />
        </div>
        <p className="text-center text-xs text-zinc-600 mt-4">Show this QR code at the counter</p>
      </Card>

      {/* Customer Info */}
      <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl space-y-3 glow-box-hover">
        <h2 className="text-sm font-black text-zinc-400 uppercase tracking-wider mb-3">Customer Information</h2>
        <div className="flex justify-between text-base">
          <span className="text-zinc-500">Name:</span>
          <span className="text-white font-bold">{booking.customer_name}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-zinc-500">Phone:</span>
          <span className="text-white font-bold">{booking.customer_phone}</span>
        </div>
      </Card>

      {/* Device Slots */}
      {booking.booking_device_slots?.length > 0 && (
        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl space-y-3 glow-box-hover">
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-wider mb-3">Device Slots</h2>
          {booking.booking_device_slots.map((slot: any, idx: number) => (
            <div key={idx} className="text-base space-y-2 border-b border-zinc-900 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between">
                <span className="text-zinc-500">Device:</span>
                <span className="text-white font-bold">{slot.device_type} #{slot.device_station_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date:</span>
                <span className="text-white">{new Date(slot.slot_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Time:</span>
                <span className="text-primary font-bold">{slot.slot_start_time} - {slot.slot_end_time}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Food Items */}
      {booking.booking_food_items?.length > 0 && (
        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl space-y-3 glow-box-hover">
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-wider mb-3">Food & Add-ons</h2>
          {(() => {
            // Group food items by name and sum quantities
            const groupedItems = booking.booking_food_items.reduce((acc: any, item: any) => {
              if (acc[item.item_name]) {
                acc[item.item_name].quantity += item.quantity;
                acc[item.item_name].line_total += parseFloat(item.line_total);
              } else {
                acc[item.item_name] = {
                  item_name: item.item_name,
                  quantity: item.quantity,
                  line_total: parseFloat(item.line_total)
                };
              }
              return acc;
            }, {});

            return Object.values(groupedItems).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-base">
                <span className="text-zinc-400">{item.item_name} <span className="text-zinc-600">(x{item.quantity})</span></span>
                <span className="text-white font-bold">₹{item.line_total.toFixed(2)}</span>
              </div>
            ));
          })()}
        </Card>
      )}

      {/* Payment Info */}
      <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl space-y-3 glow-box-strong">
        <div className="flex justify-between text-base">
          <span className="text-zinc-500">Payment Status:</span>
          <span className={`font-bold uppercase ${booking.payment_status === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
            {booking.payment_status}
          </span>
        </div>
        <div className="flex justify-between text-lg border-t border-zinc-800 pt-3">
          <span className="text-zinc-500 font-bold">Total Amount:</span>
          <span className="text-white font-black text-2xl text-primary">₹{booking.total_amount}</span>
        </div>
      </Card>

      {/* Action Buttons */}
      {booking.status === 'confirmed' && (
        <Button
          onClick={() => router.push(`/booking/${booking.id}/food?returnUrl=/my-bookings/${booking.id}${phone ? `?phone=${phone}` : ""}`)}
          className="w-full bg-gradient-primary text-[var(--button-text)] font-black uppercase text-sm h-14 rounded-xl flex items-center justify-center gap-3"
        >
          <UtensilsCrossed className="h-5 w-5" />
          ORDER FOOD & DRINKS
        </Button>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingDetailPageContent />
    </Suspense>
  );
}
