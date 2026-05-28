"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setCustomerDetails } from "@/lib/redux/slices/bookingSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Phone, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function CustomerDetailsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { deviceName, selectedSlot } = useAppSelector((state) => state.booking);

  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProcessToVerification = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber.trim()) {
      toast.error("Required Field Missing", { description: "Please provide your mobile number to continue." });
      return;
    }

    if (mobileNumber.length < 10) {
      toast.error("Invalid Number", { description: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setIsSubmitting(true);

    // Save only the phone value safely into your Redux slice notepad
    dispatch(setCustomerDetails({
      phone: mobileNumber,
      name: "",  
      email: ""
    }));

    toast.success("Details Registered", { description: "Sending secure OTP code to your device..." });
    router.push("/"); 
    setIsSubmitting(false);
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-xl mx-auto py-4 px-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Timeline Step Indicator HUD Tracks */}
      <div className="w-full max-w-xs mx-auto flex items-center justify-between pb-8 select-none">
        <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-[9px] flex items-center justify-center">1</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Time</span></div>
        <div className="h-0.5 bg-[#FFC107] flex-1 mx-2" />
        <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-[#FFC107] text-black font-black text-[9px] flex items-center justify-center">2</div><span className="text-[8px] font-black uppercase text-[#FFC107] tracking-wider">Details</span></div>
        <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
        <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-500 font-bold text-[9px] flex items-center justify-center border border-zinc-800">3</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Receipt</span></div>
      </div>

      <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6">
        
        {/* Card Header Content Panels */}
        <div className="border-b border-zinc-900 pb-4 space-y-1">
          <h3 className="text-lg font-black uppercase text-white tracking-tight">GUEST CHECKOUT DETAILS</h3>
          <p className="text-xs text-zinc-500 font-medium">Provide your contact details to receive your automated access ticket QR code.</p>
        </div>

        {/* Live Active Hold Summary Strip */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-0.5"><span className="text-[8px] font-black text-zinc-500 uppercase block">Selected Setup</span><span className="text-white font-black truncate max-w-[180px] block uppercase">{deviceName || "PLAYSTATION 5"}</span></div>
          <div className="space-y-0.5 text-right"><span className="text-[8px] font-black text-zinc-500 uppercase block">Reserved Slot</span><span className="text-[#FFC107] font-black">{selectedSlot || "Pending Hold"}</span></div>
        </div>

        {/* Form Inputs Fields Element Column */}
        <form onSubmit={handleProcessToVerification} className="space-y-4">

          {/* Contact Mobile Input Box */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Phone className="h-3 w-3 text-zinc-600"/> MOBILE NUMBER <span className="text-red-500">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 border-r border-zinc-900 pr-2">+91</span>
              <Input 
                id="phone" 
                type="tel" 
                required
                maxLength={10}
                placeholder="Enter 10-digit phone number" 
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                className="bg-zinc-950 border-zinc-900 h-12 pl-12 text-sm text-white focus-visible:ring-[#FFC107] font-mono tracking-wide"
              />
            </div>
          </div>

          {/* Action Call buttons */}
          <div className="pt-4 space-y-2">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-[#FFC107] hover:bg-[#ffcd38] text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-xl transition-all active:scale-[0.99]">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "SEND OTP"} <ChevronRight className="h-4 w-4 stroke-[3]" />
            </Button>
            
            <Button type="button" onClick={() => router.back()} variant="ghost" className="w-full border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-[11px] h-11 rounded-xl">
              ← CHOOSE ALTERNATIVE TIME SLOT
            </Button>
          </div>
        </form>

        {/* Security Shield Disclaimer Notice Footer */}
        <div className="pt-2 flex gap-2 items-center text-[10px] text-zinc-600 justify-center select-none border-t border-zinc-950">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-700" />
          <span>Your database session is soft-locked securely. We do not transmit spam communications.</span>
        </div>
      </Card>
    </div>
  );
}