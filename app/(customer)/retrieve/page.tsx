"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Phone, Loader2, Calendar, Clock, QrCode, UtensilsCrossed, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getBookingsByPhone } from "./actions";
import { QRCodeSVG } from "qrcode.react";

export default function RetrieveBookingPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!phone.trim() || phone.length < 10) {
      toast.error("Invalid Phone", { description: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setBookings([]);
    setSelectedBooking(null);

    const result = await getBookingsByPhone(phone);

    if (result.success) {
      setBookings(result.bookings || []);
      if (result.bookings.length === 0) {
        toast.info("No Bookings Found", { description: "No bookings found for this phone number." });
      } else {
        toast.success("Bookings Found!", { description: `Found ${result.bookings.length} booking(s).` });
      }
    } else {
      toast.error("Error", { description: result.error || "Failed to fetch bookings." });
      setBookings([]);
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
          <p className="text-sm text-zinc-500">Enter your phone number to view all your bookings</p>
        </div>

        {/* Search Card */}
        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-search" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-zinc-600" /> MOBILE NUMBER
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 border-r border-zinc-900 pr-2">+91</span>
                  <Input
                    id="phone-search"
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
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 px-8 rounded-xl"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SEARCH"}
                </Button>
              </div>
            </div>
          </form>
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
            <Search className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-400 mb-2">No Bookings Found</h3>
            <p className="text-sm text-zinc-600">No bookings found for this phone number.</p>
          </Card>
        )}

        {/* Bookings List */}
        {!isLoading && !selectedBooking && bookings.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-sm font-black text-zinc-500 uppercase tracking-wider">
              {bookings.length} Booking{bookings.length > 1 ? "s" : ""} Found
            </h2>

            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="bg-[#111] border border-zinc-900 p-5 shadow-lg rounded-xl hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-primary font-mono">{booking.booking_number}</span>
                      {getStatusBadge(booking.status)}
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

                    className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-10 px-4"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Selected Booking Details */}
        {selectedBooking && (
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
                      {getStatusBadge(selectedBooking.status)}
                      <span className="text-xs text-zinc-600">•</span>
                      <span className={`text-xs font-bold uppercase ${selectedBooking.payment_status === 'paid' ? 'text-green-500' :
                          selectedBooking.payment_status === 'pending' ? 'text-yellow-500' :
                            'text-zinc-500'
                        }`}>
                        {selectedBooking.payment_status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* QR Code */}
            <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-wider">
                  <QrCode className="h-4 w-4" />
                  <span>Booking QR Code</span>
                </div>
                <div className="flex justify-center bg-white p-6 rounded-xl">
                  <QRCodeSVG value={selectedBooking.booking_number} size={200} level="H" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-zinc-500">Booking Number</p>
                  <p className="text-xl font-black text-primary font-mono tracking-wider">{selectedBooking.booking_number}</p>
                  <p className="text-xs text-zinc-600">Show this QR code at the counter</p>
                </div>
              </div>
            </Card>

            {/* Customer Info */}
            <Card className="bg-[#111] border border-zinc-900 p-5 shadow-lg rounded-xl">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Customer Information
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between  border-b border-zinc-900">
                  <span className="text-zinc-500">Customer:</span>
                  <span className="text-white font-bold">{selectedBooking.customer_name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-900">
                  <span className="text-zinc-500">Phone:</span>
                  <span className="text-primary font-bold">{selectedBooking.customer_phone}</span>
                </div>
                {selectedBooking.customer_email && (
                  <div className="flex items-center justify-between ">
                    <span className="text-zinc-500">Email:</span>
                    <span className="text-white font-bold truncate ml-2">{selectedBooking.customer_email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-zinc-900">
                  <span className="text-zinc-500">DOB:</span>
                  <span className="text-white font-bold">{selectedBooking.customer_dob}</span>
                </div>
              </div>
            </Card>

            {/* Device Slots */}
            {selectedBooking.booking_device_slots?.length > 0 && (
              <Card className="bg-[#111] border border-zinc-900 p-2 shadow-lg rounded-xl">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Device Slots
                </h3>
                <div className="space-y-4">
                  {selectedBooking.booking_device_slots.map((slot: any, idx: number) => (
                    <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                      <div className="space-y-5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 whitespace-no-wrap">Device:</span>
                          <span className="text-white font-black text-right break-words leading-tight">{slot.device_type} <span className="text-primary text-[13.5px]">#{slot.device_station_number}</span></span>
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
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Food Items */}
            {selectedBooking.booking_food_items?.length > 0 && (
              <Card className="bg-[#111] border border-zinc-900 p-5 shadow-lg rounded-xl">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  Food & Add-ons
                </h3>
                <div className="space-y-2">
                  {selectedBooking.booking_food_items.map((item: any, idx: number) => (
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
                  <span className="text-white font-bold">₹{selectedBooking.device_subtotal}</span>
                </div>
                {selectedBooking.food_subtotal > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-500">Food Charges:</span>
                    <span className="text-white font-bold">₹{selectedBooking.food_subtotal}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <span className="text-white font-black text-base">TOTAL AMOUNT:</span>
                  <span className="text-primary font-black text-2xl">₹{selectedBooking.total_amount}</span>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'checked_in') && (
                <Button
                  onClick={() => router.push(`/food?bookingId=${selectedBooking.id}&bookingNumber=${selectedBooking.booking_number}&phone=${selectedBooking.customer_phone}&name=${selectedBooking.customer_name}&date_of_birth=${selectedBooking.customer_dob || ''}`)}
                  className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-2"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  ORDER FOOD & DRINKS
                </Button>
              )}
              <Button
                onClick={() => router.push("/booking")}
                variant="outline"
                className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-11 rounded-xl"
              >
                BOOK ANOTHER SLOT
              </Button>
              <Button
                onClick={() => setSelectedBooking(null)}
                variant="ghost"
                className="w-full border border-zinc-800 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-xs h-10 rounded-xl"
              >
                BACK TO SEARCH
              </Button>
            </div>
          </div>
        )}

        {/* Back to Home */}
        {!selectedBooking && (
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="w-full text-zinc-600 hover:text-zinc-400 font-bold uppercase text-xs h-10"
          >
            ← BACK TO HOME
          </Button>
        )}
      </div>
    </div>
  );
}
