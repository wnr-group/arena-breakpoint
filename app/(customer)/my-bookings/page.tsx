"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, Calendar, Clock, QrCode, UtensilsCrossed, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getCustomerBookings } from "./actions";
import { QRCodeSVG } from "qrcode.react";

function MyBookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneFromUrl = searchParams.get("phone");

  const [phone, setPhone] = useState(phoneFromUrl || "");
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    if (phoneFromUrl) {
      handleSearch();
    }
  }, [phoneFromUrl]);

  const handleSearch = async () => {
    if (!phone.trim() || phone.length < 10) {
      toast.error("Invalid Phone", { description: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    const result = await getCustomerBookings(phone);

    if (result.success) {
      setBookings(result.bookings || []);
      if (result.bookings.length === 0) {
        toast.info("No Bookings Found", { description: "No bookings found for this phone number." });
      }
    } else {
      toast.error("Error", { description: result.error || "Failed to fetch bookings." });
      setBookings([]);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0a14] text-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">MY BOOKINGS</h1>
          <p className="text-sm text-zinc-500">View your booking history and details</p>
        </div>

        {/* Search Card */}
        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl glow-box-hover">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-phone" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-zinc-600" /> MOBILE NUMBER
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 border-r border-zinc-900 pr-2">+91</span>
                  <Input
                    id="search-phone"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="bg-zinc-950 border-zinc-900 h-12 pl-12 text-sm text-white focus-visible:ring-primary font-mono tracking-wide"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 px-6 rounded-xl"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SEARCH"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* No Results */}
        {hasSearched && !isLoading && bookings.length === 0 && (
          <Card className="bg-[#111] border border-zinc-900 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-400 mb-2">No Bookings Found</h3>
            <p className="text-sm text-zinc-600">No bookings found for this phone number.</p>
          </Card>
        )}

        {/* Bookings List */}
        {!isLoading && bookings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-zinc-500 uppercase tracking-wider">
              {bookings.length} Booking{bookings.length > 1 ? "s" : ""} Found
            </h2>

            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="bg-[#111] border border-zinc-900 p-5 shadow-lg rounded-xl hover:border-primary/50 transition-all cursor-pointer glow-box-hover"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-primary font-mono">{booking.booking_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border border-green-500/30' :
                          booking.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
                            'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-white font-bold">
                          {booking.booking_device_slots?.[0]?.slot_date ?
                            new Date(booking.booking_device_slots[0].slot_date).toLocaleDateString() :
                            'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-white font-bold">
                          {booking.booking_device_slots?.[0]?.slot_start_time || 'N/A'}
                        </span>
                      </div>
                      <div className="text-zinc-400">
                        Amount: <span className="text-white font-black">₹{booking.total_amount}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(booking);
                    }}
                    className="border-primary bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-10 px-4"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Back Button */}
        <Button onClick={() => router.push("/")} variant="ghost" className="w-full border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-xs h-11 rounded-xl">
          ← BACK TO HOME
        </Button>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl max-w-md w-full space-y-6 max-h-[90vh] overflow-y-auto glow-box-hover">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white">Booking Details</h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">{selectedBooking.booking_number}</p>
              </div>
              <Button
                onClick={() => setSelectedBooking(null)}
                variant="ghost"
                size="sm"
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* QR Code */}
            <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-900 space-y-4 glow-box-strong">
              <div className="flex items-center justify-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-wider">
                <QrCode className="h-4 w-4" />
                <span>Booking QR Code</span>
              </div>
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <QRCodeSVG value={selectedBooking.booking_number} size={160} level="H" />
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2 glow-box-hover">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Customer Information</h4>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Name:</span> <span className="text-white font-bold">{selectedBooking.customer_name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Phone:</span> <span className="text-white font-bold">{selectedBooking.customer_phone}</span></div>
            </div>

            {/* Device Slots */}
            {selectedBooking.booking_device_slots?.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2 glow-box-hover">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Device Slots</h4>
                {selectedBooking.booking_device_slots.map((slot: any, idx: number) => (
                  <div key={idx} className="text-sm space-y-1 border-b border-zinc-900 pb-2 last:border-0">
                    <div className="flex justify-between"><span className="text-zinc-500">Device:</span> <span className="text-white font-bold">{slot.device_type} #{slot.device_station_number}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Date:</span> <span className="text-white">{new Date(slot.slot_date).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Time:</span> <span className="text-primary font-bold">{slot.slot_start_time} - {slot.slot_end_time}</span></div>
                  </div>
                ))}
              </div>
            )}

            {/* Food Items */}
            {selectedBooking.booking_food_items?.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2 glow-box-hover">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Food & Add-ons</h4>
                {selectedBooking.booking_food_items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{item.item_name} (x{item.quantity})</span>
                    <span className="text-white font-bold">₹{item.line_total}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2 glow-box-strong">
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Payment Status:</span> <span className={`font-bold uppercase ${selectedBooking.payment_status === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>{selectedBooking.payment_status}</span></div>
              <div className="flex justify-between text-sm border-t border-zinc-800 pt-2"><span className="text-zinc-500">Total Amount:</span> <span className="text-white font-black text-lg">₹{selectedBooking.total_amount}</span></div>
            </div>

            {/* Action Buttons */}
            {selectedBooking.status === 'confirmed' && (
              <Button
                onClick={() => router.push(`/booking/${selectedBooking.id}/food`)}
                className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-2"
              >
                <UtensilsCrossed className="h-4 w-4" />
                ORDER FOOD & DRINKS
              </Button>
            )}

            <Button
              onClick={() => setSelectedBooking(null)}
              variant="ghost"
              className="w-full border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-xs h-10 rounded-xl"
            >
              CLOSE
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <MyBookingsPageContent />
    </Suspense>
  );
}
