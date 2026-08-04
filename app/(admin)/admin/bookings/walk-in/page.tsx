"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Monitor, UtensilsCrossed, ArrowLeft } from "lucide-react";

export default function WalkInSelectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#52525b] hover:text-[#111115] transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#111115]">Walk-In Booking</h1>
            <p className="text-[#52525b] mt-1">Select booking type</p>
          </div>
        </div>

        {/* Booking Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device Booking */}
          <Card
            onClick={() => router.push("/admin/bookings/walk-in-device")}
            className="bg-[#f4f4f5] border-[#e4e4e7] hover:border-primary/50 p-8 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(184,134,11,0.2)] group"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(184,134,11,0.3)] transition-all">
                <Monitor className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#111115] mb-2">Device Booking</h2>
                <p className="text-sm text-[#52525b]">
                  Book gaming devices with time slots
                </p>
              </div>
              <div className="pt-4 border-t border-[#e4e4e7] w-full">
                <ul className="text-sm text-[#52525b] space-y-2">
                  <li>✓ Select device type</li>
                  <li>✓ Choose time slot</li>
                  <li>✓ Add players</li>
                  <li>✓ Optional food order</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Food-Only Booking */}
          <Card
            onClick={() => router.push("/admin/bookings/walk-in-food")}
            className="bg-[#f4f4f5] border-[#e4e4e7] hover:border-primary/50 p-8 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(184,134,11,0.2)] group"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(184,134,11,0.3)] transition-all">
                <UtensilsCrossed className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#111115] mb-2">Food Only</h2>
                <p className="text-sm text-[#52525b]">
                  Order food & beverages without device booking
                </p>
              </div>
              <div className="pt-4 border-t border-[#e4e4e7] w-full">
                <ul className="text-sm text-[#52525b] space-y-2">
                  <li>✓ Customer lookup</li>
                  <li>✓ Select menu items</li>
                  <li>✓ Quick checkout</li>
                  <li>✓ Immediate payment</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Helper Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#52525b]">
            Choose the appropriate booking type based on customer needs
          </p>
        </div>
      </div>
    </div>
  );
}
