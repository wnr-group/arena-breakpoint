"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setCustomerDetails, resetBooking } from "@/lib/redux/slices/bookingSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Phone, Loader2, ChevronRight, User, Mail, CheckCircle2, QrCode, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { checkCustomerExists, confirmBooking } from "../actions";
import { QRCodeSVG } from "qrcode.react";

type Step = "phone" | "details" | "summary" | "success";

export default function CustomerDetailsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const bookingState = useAppSelector((state) => state.booking);
  const { deviceTypeName, selectedSlot, deviceTypeId, selectedDate, slotStartTime, slotEndTime, hourlyRate, addons, total, subtotal, playerCount, includedPlayers, extraPlayerCharge } = bookingState;

  const [step, setStep] = useState<Step>("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerExists, setCustomerExists] = useState(false);
  const [existingCustomerData, setExistingCustomerData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
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

    // Check if customer exists
    const result = await checkCustomerExists(mobileNumber);

    if (result.exists && result.customer) {
      // Customer exists, skip to summary
      setCustomerExists(true);
      setExistingCustomerData(result.customer);
      setCustomerName(result.customer.name);
      setCustomerEmail(result.customer.email || "");

      dispatch(setCustomerDetails({
        phone: mobileNumber,
        name: result.customer.name,
        email: result.customer.email || ""
      }));

      toast.success("Welcome back!", { description: `Hey ${result.customer.name}! We found your profile.` });
      setStep("summary");
    } else {
      // New customer, ask for details
      toast.info("New Customer", { description: "Please provide your name and email." });
      setStep("details");
    }

    setIsSubmitting(false);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Required Field Missing", { description: "Please provide your name." });
      return;
    }

    dispatch(setCustomerDetails({
      phone: mobileNumber,
      name: customerName,
      email: customerEmail
    }));

    toast.success("Details Saved", { description: "Review your booking summary." });
    setStep("summary");
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);

    const result = await confirmBooking({
      phone: mobileNumber,
      name: customerName || existingCustomerData?.name,
      email: customerEmail || existingCustomerData?.email || "",
      deviceTypeId: deviceTypeId!,
      deviceTypeName: deviceTypeName!,
      selectedDate: selectedDate!,
      selectedSlot: selectedSlot!,
      slotStartTime: slotStartTime!,
      slotEndTime: slotEndTime!,
      hourlyRate: hourlyRate!,
      addons: addons,
      subtotal: subtotal,
      total: total,
      playerCount: playerCount,
      includedPlayers: includedPlayers,
      extraPlayerCharge: extraPlayerCharge
    });

    if (result.success) {
      setBookingNumber(result.bookingNumber || "");
      setBookingId(result.bookingId || "");
      toast.success("Booking Confirmed!", { description: "Your slot has been reserved successfully." });
      dispatch(resetBooking()); // Clear timer and booking state after successful confirmation
      setStep("success");
    } else {
      toast.error("Booking Failed", { description: result.error || "Something went wrong. Please try again." });
    }

    setIsSubmitting(false);
  };

  const handleNewBooking = () => {
    dispatch(resetBooking());
    router.push("/booking");
  };

  if (!mounted) return null;

  // Phone Step UI
  if (step === "phone") {
    return (
      <div className="w-full max-w-xl mx-auto py-4 px-2 animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Timeline Step Indicator HUD Tracks */}
        <div className="w-full max-w-xs mx-auto flex items-center justify-between pb-8 select-none">
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-[9px] flex items-center justify-center">1</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Time</span></div>
          <div className="h-0.5 bg-primary flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">2</div><span className="text-[8px] font-black uppercase text-primary tracking-wider">Details</span></div>
          <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-500 font-bold text-[9px] flex items-center justify-center border border-zinc-800">3</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Confirm</span></div>
        </div>

        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6">

          {/* Card Header Content Panels */}
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">CUSTOMER IDENTIFICATION</h3>
            <p className="text-xs text-zinc-500 font-medium">Enter your mobile number to continue with booking.</p>
          </div>

          {/* Live Active Hold Summary Strip */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-0.5"><span className="text-[8px] font-black text-zinc-500 uppercase block">Selected Setup</span><span className="text-white font-black truncate max-w-[180px] block uppercase">{deviceTypeName || "PLAYSTATION 5"}</span></div>
            <div className="space-y-0.5 text-right"><span className="text-[8px] font-black text-zinc-500 uppercase block">Reserved Slot</span><span className="text-primary font-black">{selectedSlot || "Pending Hold"}</span></div>
          </div>

          {/* Form Inputs Fields Element Column */}
          <form onSubmit={handlePhoneSubmit} className="space-y-4">

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
                  className="bg-zinc-950 border-zinc-900 h-12 pl-12 text-sm text-white focus-visible:ring-primary font-mono tracking-wide"
                />
              </div>
            </div>

            {/* Action Call buttons */}
            <div className="pt-4 space-y-2">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-xl transition-all active:scale-[0.99]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "CONTINUE"} <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Button>

              <Button type="button" onClick={() => router.back()} variant="ghost" className="w-full border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-[11px] h-11 rounded-xl">
                ← CHOOSE ALTERNATIVE TIME SLOT
              </Button>
            </div>
          </form>

          {/* Security Shield Disclaimer Notice Footer */}
          <div className="pt-2 flex gap-2 items-center text-[10px] text-zinc-600 justify-center select-none border-t border-zinc-950">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-700" />
            <span>Your data is stored securely. No OTP required.</span>
          </div>
        </Card>
      </div>
    );
  }

  // Customer Details Step (for new customers)
  if (step === "details") {
    return (
      <div className="w-full max-w-xl mx-auto py-4 px-2 animate-in fade-in duration-300">
        <div className="w-full max-w-xs mx-auto flex items-center justify-between pb-8 select-none">
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-green-500 text-black font-black text-[9px] flex items-center justify-center"><CheckCircle2 className="h-3 w-3"/></div><span className="text-[8px] font-black uppercase text-green-500 tracking-wider">Phone</span></div>
          <div className="h-0.5 bg-primary flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">2</div><span className="text-[8px] font-black uppercase text-primary tracking-wider">Details</span></div>
          <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-500 font-bold text-[9px] flex items-center justify-center border border-zinc-800">3</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Confirm</span></div>
        </div>

        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6">
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">NEW CUSTOMER REGISTRATION</h3>
            <p className="text-xs text-zinc-500 font-medium">Please provide your details to create your profile.</p>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary"/>
              <span className="text-zinc-500">Phone Number:</span>
              <span className="text-white font-black">+91 {mobileNumber}</span>
            </div>
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><User className="h-3 w-3 text-zinc-600"/> FULL NAME <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                type="text"
                required
                placeholder="Enter your full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Mail className="h-3 w-3 text-zinc-600"/> EMAIL ADDRESS</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email (optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary"
              />
            </div>

            <div className="pt-4 space-y-2">
              <Button type="submit" className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5">
                CONTINUE TO SUMMARY <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Button>
              <Button type="button" onClick={() => setStep("phone")} variant="ghost" className="w-full border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-[11px] h-11 rounded-xl">
                ← CHANGE PHONE NUMBER
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Summary & Confirmation Step
  if (step === "summary") {
    return (
      <div className="w-full max-w-2xl mx-auto py-4 px-2 animate-in fade-in duration-300">
        <div className="w-full max-w-xs mx-auto flex items-center justify-between pb-8 select-none">
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-green-500 text-black font-black text-[9px] flex items-center justify-center"><CheckCircle2 className="h-3 w-3"/></div><span className="text-[8px] font-black uppercase text-green-500 tracking-wider">Phone</span></div>
          <div className="h-0.5 bg-green-500 flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-green-500 text-black font-black text-[9px] flex items-center justify-center"><CheckCircle2 className="h-3 w-3"/></div><span className="text-[8px] font-black uppercase text-green-500 tracking-wider">Details</span></div>
          <div className="h-0.5 bg-primary flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">3</div><span className="text-[8px] font-black uppercase text-primary tracking-wider">Confirm</span></div>
        </div>

        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6">
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">BOOKING SUMMARY</h3>
            <p className="text-xs text-zinc-500 font-medium">Review your booking details before confirmation.</p>
          </div>

          {/* Customer Details */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-500 text-xs">Name:</span> <span className="text-white font-bold">{customerName || existingCustomerData?.name}</span></div>
              <div><span className="text-zinc-500 text-xs">Phone:</span> <span className="text-white font-bold">+91 {mobileNumber}</span></div>
              {(customerEmail || existingCustomerData?.email) && <div className="md:col-span-2"><span className="text-zinc-500 text-xs">Email:</span> <span className="text-white font-bold">{customerEmail || existingCustomerData?.email}</span></div>}
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Booking Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Device:</span> <span className="text-white font-black">{deviceTypeName}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Date:</span> <span className="text-white font-bold">{new Date(selectedDate!).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Time Slot:</span> <span className="text-primary font-black">{selectedSlot}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Duration:</span> <span className="text-white font-bold">{slotStartTime} - {slotEndTime}</span></div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Price Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Base Rate:</span> <span className="text-white">₹{hourlyRate}</span></div>
              {addons.length > 0 && addons.map((addon) => (
                <div key={addon.id} className="flex justify-between"><span className="text-zinc-500">{addon.name} (x{addon.quantity}):</span> <span className="text-white">₹{addon.price * addon.quantity}</span></div>
              ))}
              <div className="border-t border-zinc-800 pt-2 flex justify-between font-black"><span className="text-white">TOTAL AMOUNT:</span> <span className="text-primary text-lg">₹{total}</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={handleConfirmBooking} disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "CONFIRM BOOKING"} <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button type="button" onClick={() => customerExists ? setStep("phone") : setStep("details")} variant="ghost" className="w-full border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-[11px] h-11 rounded-xl">
              ← BACK
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success Step
  if (step === "success") {
    return (
      <div className="w-full max-w-2xl mx-auto py-4 px-2 animate-in fade-in duration-500">
        <Card className="bg-[#111] border border-green-500/20 p-8 shadow-2xl rounded-2xl space-y-6">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase text-white tracking-tight">BOOKING CONFIRMED!</h3>
              <p className="text-sm text-zinc-400">Your slot has been successfully reserved.</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-900 space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-wider">
              <QrCode className="h-4 w-4" />
              <span>Booking QR Code</span>
            </div>
            <div className="flex justify-center bg-white p-4 rounded-lg">
              <QRCodeSVG value={bookingNumber} size={160} level="H" />
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Booking Number</p>
              <p className="text-lg font-black text-primary font-mono tracking-wider">{bookingNumber}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Booking Details</h4>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Customer:</span> <span className="text-white font-bold">{customerName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Device:</span> <span className="text-white font-bold">{deviceTypeName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Date & Time:</span> <span className="text-primary font-bold">{new Date(selectedDate!).toLocaleDateString()} • {selectedSlot}</span></div>
            <div className="flex justify-between text-sm border-t border-zinc-800 pt-2 mt-2"><span className="text-zinc-500">Amount Paid:</span> <span className="text-white font-black">₹{total}</span></div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button onClick={() => router.push(`/booking/${bookingId}/food`)} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              ORDER FOOD & DRINKS
            </Button>
            <Button onClick={handleNewBooking} variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary/10 font-black uppercase text-xs h-11 rounded-xl">
              BOOK ANOTHER SLOT
            </Button>
            <Button onClick={() => router.push(`/my-bookings?phone=${mobileNumber}`)} variant="ghost" className="w-full border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold uppercase text-[11px] h-11 rounded-xl">
              VIEW MY BOOKINGS
            </Button>
            <Button onClick={() => router.push("/")} variant="ghost" className="w-full text-zinc-600 hover:text-zinc-400 font-bold uppercase text-[11px] h-10">
              BACK TO HOME
            </Button>
          </div>

          {/* Footer Note */}
          <div className="pt-2 flex gap-2 items-center text-[10px] text-zinc-600 justify-center border-t border-zinc-950">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-700" />
            <span>Show this QR code at the counter to start your session</span>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}