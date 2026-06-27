"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Timer, ShieldAlert } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { resetBooking } from "@/lib/redux/slices/bookingSlice";
import { toast } from "sonner";
import Navbar from "@/components/customer/layout/NavBar";
import Footer from "@/components/customer/layout/Footer";
import AnimatedBackground from "@/components/customer/layout/AnimatedBackground";
import { ScrollToTop } from "@/components/shared/ScrollToTop";


export default function CustomerRouteGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const slotLockExpiry = useAppSelector((state) => state.booking.slotLockExpiry);

  const [timeLeftStr, setTimeLeftStr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !slotLockExpiry) {
      setTimeLeftStr(null);
      return;
    }

    const computeTimeDelta = () => {
      const remainingTime = slotLockExpiry - Date.now();
      if (remainingTime <= 0) {
        clearInterval(clockTicker);
        setTimeLeftStr(null);
        dispatch(resetBooking());
        toast("Hold Window Expired", {
          description: "Your temporary slot reservation hold timed out.",
          icon: <ShieldAlert className="text-red-500 h-5 w-5" />
        });
        router.push("/booking");
        return;
      }
      const mins = Math.floor(remainingTime / 60000);
      const secs = Math.floor((remainingTime % 60000) / 1000);
      setTimeLeftStr(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    computeTimeDelta();
    const clockTicker = setInterval(computeTimeDelta, 1000);
    return () => clearInterval(clockTicker);
  }, [slotLockExpiry, mounted, dispatch, router]);

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[#0d0a14] relative">
        {/* Animated purple background blobs */}
        <AnimatedBackground />

        {/* 10-Minute Hold HUD Alert Banner */}
        {mounted && timeLeftStr && (
          <div className="w-full bg-[#E53e3e] text-white text-[11px] font-black tracking-widest uppercase py-2.5 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-xl select-none">
            <Timer className="h-3.5 w-3.5 animate-pulse text-white" />
            <span>Slot Held For: <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-primary ml-1">{timeLeftStr}</span></span>
          </div>
        )}

        {/* REUSABLE COMPONENT INJECTIONS */}
        <Navbar />

        <main className="flex-1 w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-8 flex flex-col mt-16 md:mt-10 mb-8 relative z-10">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}