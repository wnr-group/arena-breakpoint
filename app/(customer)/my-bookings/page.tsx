"use client";

import { useState, useEffect, Suspense } from "react";
import { BreakpointLoader } from "@/components/shared/BreakpointLoader";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Calendar, Clock, QrCode, UtensilsCrossed, AlertCircle } from "lucide-react";
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
                  className="bg-gradient-primary text-[var(--button-text)] font-black uppercase text-xs h-12 px-6 rounded-xl"
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
            <BreakpointLoader size="lg" />
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
                onClick={() => router.push(`/my-bookings/${booking.id}?phone=${phone}`)}
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
                      router.push(`/my-bookings/${booking.id}?phone=${phone}`);
                    }}
                    className="bg-gradient-primary text-[var(--button-text)] font-black uppercase text-xs h-10 px-4"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Back Button */}
        <Button onClick={() => router.push("/")} variant="outline" className="w-full font-bold uppercase text-xs h-11 rounded-xl">
          ← BACK TO HOME
        </Button>
      </div>

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