"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Calendar, Clock, QrCode, UtensilsCrossed, User, Phone, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getBookingByNumber } from "./actions";
import { QRCodeSVG } from "qrcode.react";

export default function RetrieveBookingPage() {
  const router = useRouter();

  const [bookingNumber, setBookingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!bookingNumber.trim()) {
      toast.error("Required Field", { description: "Please enter a booking number." });
      return;
    }

    setIsLoading(true);

    const result = await getBookingByNumber(bookingNumber.trim().toUpperCase());

    if (result.success && result.booking) {
      setBooking(result.booking);
      toast.success("Booking Found!", { description: "Your booking details are displayed below." });
    } else {
      toast.error("Not Found", { description: result.error || "No booking found with this number." });
      setBooking(null);
    }

    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      confirmed: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
      checked_in: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
      completed: { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
      locked: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    };

    const config = statusConfig[status] || statusConfig.confirmed;

    return (
      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${config.bg} ${config.text} border ${config.border}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            RETRIEVE BOOKING
          </h1>
          <p className="text-sm text-zinc-500">Enter your booking number to view details and QR code</p>
        </div>

        {/* Search Card */}
        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-number" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-3 w-3 text-zinc-600"/> BOOKING NUMBER
              </Label>
              <div className="flex gap-2">
                <Input
                  id="booking-number"
                  type="text"
                  placeholder="e.g., BP-20260530-001"
                  value={bookingNumber}
                  onChange={(e) => setBookingNumber(e.target.value.toUpperCase())}
                  className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary font-mono tracking-wider flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 px-8 rounded-xl flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> SEARCH</>}
                </Button>
              </div>
              <p className="text-xs text-zinc-600">Your booking number can be found in your confirmation (e.g., BP-20260530-001)</p>
            </div>
          </form>

          {/* Alternative Search */}
          <div className="mt-6 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">Don't have your booking number?</p>
            <Button
              onClick={() => router.push("/my-bookings")}
              variant="outline"
              className="border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 font-bold uppercase text-xs h-10 px-6"
            >
              <Phone className="h-3 w-3 mr-2" />
              Search by Phone Number
            </Button>
          </div>
        </Card>

        {/* Booking Details */}
        {booking && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Status Banner */}
            <Card className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Booking Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(booking.status)}
                      <span className="text-xs text-zinc-600">•</span>
                      <span className={`text-xs font-bold uppercase ${
                        booking.payment_status === 'paid' ? 'text-green-500' :
                        booking.payment_status === 'pending' ? 'text-yellow-500' :
                        'text-zinc-500'
                      }`}>
                        {booking.payment_status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* QR Code Card */}
            <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-wider">
                  <QrCode className="h-4 w-4" />
                  <span>Booking QR Code</span>
                </div>
                <div className="flex justify-center bg-white p-6 rounded-xl">
                  <QRCodeSVG value={booking.booking_number} size={200} level="H" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-zinc-500">Booking Number</p>
                  <p className="text-xl font-black text-primary font-mono tracking-wider">{booking.booking_number}</p>
                  <p className="text-xs text-zinc-600">Show this QR code at the counter</p>
                </div>
              </div>
            </Card>

            {/* Customer Information */}
            <Card className="bg-[#111] border border-zinc-900 p-5 shadow-lg rounded-xl">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Name:</span>
                  <span className="text-white font-bold">{booking.customer_name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Phone:</span>
                  <span className="text-white font-bold">{booking.customer_phone}</span>
                </div>
                {booking.customer_email && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-500">Email:</span>
                    <span className="text-white font-bold truncate ml-2">{booking.customer_email}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Device Slots */}
            {booking.booking_device_slots?.length > 0 && (
              <Card className="bg-[#111] border border-zinc-900 p-5 shadow-lg rounded-xl">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Device Slots
                </h3>
                <div className="space-y-3">
                  {booking.booking_device_slots.map((slot: any, idx: number) => (
                    <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Device:</span>
                          <span className="text-white font-black">{slot.device_type} #{slot.device_station_number}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Date:</span>
                          <span className="text-white font-bold">{new Date(slot.slot_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Time:</span>
                          <span className="text-primary font-black flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {slot.slot_start_time} - {slot.slot_end_time}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                          <span className="text-zinc-500">Duration:</span>
                          <span className="text-white font-bold">{slot.duration_hours} hour{slot.duration_hours > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Food Items */}
            {booking.booking_food_items?.length > 0 && (
              <Card className="bg-[#111] border border-zinc-900 p-5 shadow-lg rounded-xl">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  Food & Add-ons
                </h3>
                <div className="space-y-2">
                  {booking.booking_food_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-900 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">{item.item_name}</span>
                        <span className="text-xs text-zinc-600">x{item.quantity}</span>
                      </div>
                      <span className="text-white font-bold">₹{item.line_total}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Payment Summary */}
            <Card className="bg-[#111] border border-zinc-900 p-5 shadow-lg rounded-xl">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2">
                  <span className="text-zinc-500">Device Charges:</span>
                  <span className="text-white font-bold">₹{booking.device_subtotal}</span>
                </div>
                {booking.food_subtotal > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-500">Food Charges:</span>
                    <span className="text-white font-bold">₹{booking.food_subtotal}</span>
                  </div>
                )}
                {booking.subscription_discount > 0 && (
                  <div className="flex items-center justify-between py-2 text-green-500">
                    <span>Subscription Discount:</span>
                    <span className="font-bold">-₹{booking.subscription_discount}</span>
                  </div>
                )}
                {booking.promo_discount > 0 && (
                  <div className="flex items-center justify-between py-2 text-green-500">
                    <span>Promo Discount:</span>
                    <span className="font-bold">-₹{booking.promo_discount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <span className="text-white font-black text-base">TOTAL AMOUNT:</span>
                  <span className="text-primary font-black text-2xl">₹{booking.total_amount}</span>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {booking.status === 'confirmed' && (
                <Button
                  onClick={() => router.push(`/booking/${booking.id}/food`)}
                  className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-2"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  ORDER FOOD & DRINKS
                </Button>
              )}
              <Button
                onClick={() => router.push("/booking")}
                variant="outline"
                className="w-full border-2 border-primary text-primary hover:bg-primary/10 font-black uppercase text-xs h-11 rounded-xl"
              >
                BOOK ANOTHER SLOT
              </Button>
              <Button
                onClick={() => {
                  setBooking(null);
                  setBookingNumber("");
                }}
                variant="ghost"
                className="w-full border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-xs h-10 rounded-xl"
              >
                SEARCH ANOTHER BOOKING
              </Button>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <Button
          onClick={() => router.push("/")}
          variant="ghost"
          className="w-full text-zinc-600 hover:text-zinc-400 font-bold uppercase text-xs h-10"
        >
          ← BACK TO HOME
        </Button>
      </div>
    </div>
  );
}
