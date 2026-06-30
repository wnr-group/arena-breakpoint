"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setCustomerDetails, setSubscription, setPricing, resetBooking, clearSlotTimer, setPromoCode } from "@/lib/redux/slices/bookingSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Phone, ChevronRight, User, Mail, CheckCircle2, QrCode, Cake, UtensilsCrossed, Tag } from "lucide-react";
import { toast } from "sonner";
import { checkCustomerExists, confirmBooking } from "../actions";
import { validatePromoCode, calculatePromoDiscount } from "../promo-actions";
import { QRCodeSVG } from "qrcode.react";
import { generateDurationOptions } from "@/lib/utils/timeSlots";
import { formatDateForDB, formatDateForDisplay, handleDobInput, isValidDateDDMMYYYY } from "@/lib/utils/dates";

type Step = "phone" | "details" | "summary" | "success";

export default function CustomerDetailsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const bookingState = useAppSelector((state) => state.booking);
  const { deviceTypeName, selectedSlot, deviceTypeId, selectedDate, slotStartTime, slotEndTime, selectedDuration, hourlyRate, addons, total, subtotal, playerCount, includedPlayers, extraPlayerCharge } = bookingState;

  const [step, setStep] = useState<Step>("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDob, setCustomerDob] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerExists, setCustomerExists] = useState(false);
  const [existingCustomerData, setExistingCustomerData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  const [promoCode, setPromoCodeInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const allDurations = useMemo(() => generateDurationOptions(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force scroll to top on mount and step changes to prevent landing at the bottom/footer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.scrollTop = 0;
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
    }
  }, [step]);

  const selectedDurationLabel = useMemo(() => {
    const duration = allDurations.find(d => d.value === selectedDuration);
    return duration?.label || (selectedDuration ? `${selectedDuration} mins` : "--");
  }, [selectedDuration, allDurations]);

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = handleDobInput(e.target.value);
    setCustomerDob(formatted);
  };

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
      // Convert DOB from DB format (YYYY-MM-DD) to display format (DD-MM-YYYY)
      if (result.customer.date_of_birth) {
        setCustomerDob(formatDateForDisplay(result.customer.date_of_birth));
      }

      dispatch(setCustomerDetails({
        phone: mobileNumber,
        name: result.customer.name,
        email: result.customer.email || "",
        date_of_birth: result.customer.date_of_birth
      }));

      // Set subscription if customer has active subscription
      if (result.subscription) {
        dispatch(setSubscription({
          id: result.subscription.id,
          planName: result.subscription.plan_name,
          discountPercentage: result.subscription.discount_percentage,
          endDate: result.subscription.end_date
        }));

        // Calculate and apply subscription discount
        const discountAmount = (subtotal * result.subscription.discount_percentage) / 100;
        const newTotal = subtotal - discountAmount;

        dispatch(setPricing({
          subtotal,
          subscriptionDiscount: discountAmount,
          promoDiscount: 0,
          total: newTotal
        }));

        toast.success("Welcome back!", {
          description: `Hey ${result.customer.name}! Your ${result.subscription.plan_name} is active (${result.subscription.discount_percentage}% off)`
        });
      } else {
        dispatch(setSubscription(null));
        toast.success("Welcome back!", { description: `Hey ${result.customer.name}! We found your profile.` });
      }

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

    // Validate DOB
    if (!customerDob.trim()) {
      toast.error("Required Field Missing", { description: "Please provide your date of birth." });
      return;
    }

    if (!isValidDateDDMMYYYY(customerDob)) {
      toast.error("Invalid Date", { description: "Please enter a valid date in DD-MM-YYYY format." });
      return;
    }

    const formattedDob = formatDateForDB(customerDob);
    if (!formattedDob) {
      toast.error("Invalid Date", { description: "Please check the date format." });
      return;
    }

    dispatch(setCustomerDetails({
      phone: mobileNumber,
      name: customerName,
      email: customerEmail,
      date_of_birth: formattedDob,
    }));

    toast.success("Details Saved", { description: "Review your booking summary." });
    setStep("summary");
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsApplyingPromo(true);
    const result = await validatePromoCode(promoCode);

    if (result.success && result.promo) {
      // Calculate discountable amount (device + extra players, NOT food)
      let durationInHours = 0;
      if (selectedDuration && selectedDuration > 0) {
        durationInHours = selectedDuration / 60;
      } else if (slotStartTime && slotEndTime) {
        const parseTime = (timeStr: string) => {
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (!match) return 0;
          let [, hours, minutes, period] = match;
          let hour = parseInt(hours);
          if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
          if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
          return hour * 60 + parseInt(minutes);
        };
        const startMins = parseTime(slotStartTime);
        const endMins = parseTime(slotEndTime);
        durationInHours = (endMins - startMins) / 60;
      }

      const deviceCharges = (hourlyRate || 0) * durationInHours;
      const extraPlayerCharges = (playerCount - includedPlayers) * extraPlayerCharge;
      const discountableAmount = deviceCharges + extraPlayerCharges; // NOT food

      const discount = await calculatePromoDiscount(
        discountableAmount,
        result.promo.discount_type,
        result.promo.discount_value
      );

      const addonsTotal = addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
      const calculatedSubtotal = deviceCharges + extraPlayerCharges + addonsTotal;
      const calculatedTotal = calculatedSubtotal - bookingState.subscriptionDiscount - discount;

      dispatch(setPricing({
        subtotal: calculatedSubtotal,
        subscriptionDiscount: bookingState.subscriptionDiscount,
        promoDiscount: discount,
        total: calculatedTotal,
      }));
      dispatch(setPromoCode(result.promo.code));
      toast.success("Promo code applied!", {
        description: `You saved ₹${discount.toFixed(2)} with code ${result.promo.code}`
      });
    } else {
      toast.error(result.error || "Invalid promo code");
    }
    setIsApplyingPromo(false);
  };

  const handleRemovePromo = () => {
    // Recalculate without promo
    let durationInHours = 0;
    if (selectedDuration && selectedDuration > 0) {
      durationInHours = selectedDuration / 60;
    } else if (slotStartTime && slotEndTime) {
      const parseTime = (timeStr: string) => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return 0;
        let [, hours, minutes, period] = match;
        let hour = parseInt(hours);
        if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
        return hour * 60 + parseInt(minutes);
      };
      const startMins = parseTime(slotStartTime);
      const endMins = parseTime(slotEndTime);
      durationInHours = (endMins - startMins) / 60;
    }

    const deviceCharges = (hourlyRate || 0) * durationInHours;
    const extraPlayerCharges = (playerCount - includedPlayers) * extraPlayerCharge;
    const addonsTotal = addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    const calculatedSubtotal = deviceCharges + extraPlayerCharges + addonsTotal;
    const calculatedTotal = calculatedSubtotal - bookingState.subscriptionDiscount;

    dispatch(setPricing({
      subtotal: calculatedSubtotal,
      subscriptionDiscount: bookingState.subscriptionDiscount,
      promoDiscount: 0,
      total: calculatedTotal,
    }));
    dispatch(setPromoCode(null));
    setPromoCodeInput("");
    toast.info("Promo code removed");
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);

    // Format DOB for database
    let dobForDB = "";
    if (customerDob) {
      dobForDB = formatDateForDB(customerDob);
    } else if (existingCustomerData?.date_of_birth) {
      dobForDB = existingCustomerData.date_of_birth;
    }

    const result = await confirmBooking({
      phone: mobileNumber,
      name: customerName || existingCustomerData?.name,
      email: customerEmail || existingCustomerData?.email || "",
      date_of_birth: dobForDB,
      deviceTypeId: deviceTypeId!,
      deviceTypeName: deviceTypeName!,
      selectedDate: selectedDate!,
      selectedSlot: selectedSlot!,
      slotStartTime: slotStartTime!,
      slotEndTime: slotEndTime!,
      selectedDuration: selectedDuration!,
      hourlyRate: hourlyRate!,
      addons: addons,
      subtotal: subtotal,
      total: total,
      playerCount: playerCount,
      includedPlayers: includedPlayers,
      extraPlayerCharge: extraPlayerCharge,
      subscriptionDiscount: bookingState.subscriptionDiscount,
      promoDiscount: bookingState.promoDiscount,
      promoCode: bookingState.promoCode,
      durationMinutes: selectedDuration || 60
    });

    if (result.success) {
      setBookingNumber(result.bookingNumber || "");
      setBookingId(result.bookingId || "");
      toast.success("Booking Confirmed!", { description: "Your slot has been reserved successfully." });
      dispatch(clearSlotTimer()); // Clear timer and booking state after successful confirmation
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
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-[9px] flex items-center justify-center">1</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Time Slot</span></div>
          <div className="h-0.5 bg-primary flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">2</div><span className="text-[8px] font-black uppercase text-primary tracking-wider">Details</span></div>
          <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-500 font-bold text-[9px] flex items-center justify-center border border-zinc-800">3</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Payment</span></div>
        </div>

        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6 glow-box-hover">

          {/* Card Header Content Panels **/}
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">CUSTOMER IDENTIFICATION</h3>
            <p className="text-xs text-zinc-500 font-medium">Enter your mobile number to continue with booking.</p>
          </div>

          {/* Live Active Hold Summary Strip */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 grid grid-cols-2 gap-2 text-xs glow-box-hover">
            <div className="space-y-0.5"><span className="text-[8px] font-black text-zinc-500 uppercase block">Selected Setup</span><span className="text-white font-black text-left break-words leading-tight max-w-[200px] block uppercase">{deviceTypeName || "PLAYSTATION 5"}</span></div>
            <div className="space-y-0.5 text-right"><span className="text-[8px] font-black text-zinc-500 uppercase block">Reserved Slot</span><span className="text-primary text-[12px] text-right font-black">{selectedSlot || "Pending Hold"}</span></div>
          </div>

          {/* Form Inputs Fields Element Column */}
          <form onSubmit={handlePhoneSubmit} className="space-y-4">

            {/* Contact Mobile Input Box */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Phone className="h-3 w-3 text-zinc-600" /> MOBILE NUMBER <span className="text-red-500">*</span></Label>
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
              <Button variant="gradient" type="submit" disabled={isSubmitting || mobileNumber.trim().length < 10} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-xl transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none">
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
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-green-500 text-black font-black text-[9px] flex items-center justify-center"><CheckCircle2 className="h-3 w-3" /></div><span className="text-[8px] font-black uppercase text-green-500 tracking-wider">Phone</span></div>
          <div className="h-0.5 bg-primary flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">2</div><span className="text-[8px] font-black uppercase text-primary tracking-wider">Details</span></div>
          <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-500 font-bold text-[9px] flex items-center justify-center border border-zinc-800">3</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Payment</span></div>
        </div>

        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6 glow-box-hover">
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">NEW CUSTOMER REGISTRATION</h3>
            <p className="text-xs text-zinc-500 font-medium">Please provide your details to create your profile.</p>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-zinc-500">Phone Number:</span>
              <span className="text-white font-black">+91 {mobileNumber}</span>
            </div>
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><User className="h-3 w-3 text-zinc-600" /> FULL NAME <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="dob" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cake className="h-3 w-3 text-zinc-600" /> DATE OF BIRTH (DD-MM-YYYY)
              </Label>
              <Input
                id="dob"
                type="text"
                placeholder="DD-MM-YYYY"
                required
                maxLength={10}
                value={customerDob}
                onChange={handleDobChange}
                className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white font-mono tracking-wider focus-visible:ring-primary rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Mail className="h-3 w-3 text-zinc-600" /> EMAIL ADDRESS</Label>
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
              <Button variant="gradient" type="submit" disabled={isSubmitting || !customerName.trim() || !customerDob.trim() || customerDob.length < 10} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none">
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
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-green-500 text-black font-black text-[9px] flex items-center justify-center"><CheckCircle2 className="h-3 w-3" /></div><span className="text-[8px] font-black uppercase text-green-500 tracking-wider">Phone</span></div>
          <div className="h-0.5 bg-green-500 flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-green-500 text-black font-black text-[9px] flex items-center justify-center"><CheckCircle2 className="h-3 w-3" /></div><span className="text-[8px] font-black uppercase text-green-500 tracking-wider">Details</span></div>
          <div className="h-0.5 bg-primary flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">3</div><span className="text-[8px] font-black uppercase text-primary tracking-wider">Payment</span></div>
        </div>

        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6 glow-box-hover">
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">BOOKING SUMMARY</h3>
            <p className="text-xs text-zinc-500 font-medium">Review your booking details before confirmation.</p>
          </div>

          {/* Customer Information */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3 glow-box-hover">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Customer Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Customer:</span> <span className="text-white font-bold">{customerName || existingCustomerData?.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Phone:</span> <span className="text-primary font-bold">+91 {mobileNumber}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Email:</span> <span className="text-white font-bold truncate ml-4">{customerEmail || existingCustomerData?.email}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">DOB:</span> <span className="text-white font-bold">{customerDob}</span></div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3 glow-box-hover">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Booking Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Device:</span> <span className="text-white font-bold text-right">{deviceTypeName}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Date:</span> <span className="text-white font-bold">{selectedDate ? new Date(selectedDate).toLocaleDateString() : "--"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Time Slot:</span> <span className="text-primary font-bold">{selectedSlot}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Duration:</span> <span className="text-white font-bold">{selectedDurationLabel}</span></div>
            </div>
          </div>

          {/* Active Subscription (if any) */}
          {bookingState.activeSubscriptionId && (
            <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 p-4 rounded-xl border border-primary/30 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider">{bookingState.subscriptionPlanName} Active</h4>
                  <p className="text-[10px] text-zinc-400">You're getting {bookingState.subscriptionDiscountPercentage}% off on this booking!</p>
                </div>
              </div>
            </div>
          )}

          {/* Promo Code Section */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-zinc-500" />
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                Have a Promo Code?
              </h4>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                className="bg-[#0a0a0a] border-zinc-800 text-white uppercase font-mono text-sm"
                disabled={isApplyingPromo || bookingState.promoCode !== null}
              />
              {bookingState.promoCode ? (
                <Button
                  onClick={handleRemovePromo}
                  variant="outline"
                  className="text-red-400 border-red-500/30 hover:bg-red-950/20 px-4"
                  disabled={isApplyingPromo}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || isApplyingPromo}
                  variant="gradient"
                  className="px-6"
                >
                  {isApplyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              )}
            </div>
            {bookingState.promoCode && (
              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-950/30 px-3 py-2 rounded-lg border border-green-500/20">
                <CheckCircle2 className="h-3 w-3" />
                <span className="font-bold">Code "{bookingState.promoCode}" applied successfully!</span>
              </div>
            )}
          </div>

          {/* Pricing Details */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3 glow-box-strong">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Price Breakdown</h4>
            <div className="space-y-2 text-sm">
              {(() => {
                // Calculate duration - fallback to calculating from times if selectedDuration is missing
                let durationInHours = 0;

                if (selectedDuration && selectedDuration > 0) {
                  durationInHours = selectedDuration / 60;
                } else if (slotStartTime && slotEndTime) {
                  // Fallback: calculate from start/end times
                  const parseTime = (timeStr: string) => {
                    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (!match) return 0;
                    let [, hours, minutes, period] = match;
                    let hour = parseInt(hours);
                    if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
                    if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
                    return hour * 60 + parseInt(minutes);
                  };
                  const startMins = parseTime(slotStartTime);
                  const endMins = parseTime(slotEndTime);
                  durationInHours = (endMins - startMins) / 60;
                }

                const deviceCharges = hourlyRate! * durationInHours;
                const extraPlayerCharges = (playerCount - includedPlayers) * extraPlayerCharge;
                const addonsTotal = addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
                const calculatedSubtotal = deviceCharges + extraPlayerCharges + addonsTotal;
                const calculatedTotal = calculatedSubtotal - bookingState.subscriptionDiscount - bookingState.promoDiscount;

                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Device Booking ({durationInHours}h × ₹{hourlyRate}):</span>
                      <span className="text-white">₹{deviceCharges.toFixed(2)}</span>
                    </div>

                    {playerCount > includedPlayers && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Extra Players ({playerCount - includedPlayers} × ₹{extraPlayerCharge}):</span>
                        <span className="text-white">₹{extraPlayerCharges.toFixed(2)}</span>
                      </div>
                    )}

                    {addons.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Add-ons:</span>
                        <span className="text-white">₹{addonsTotal.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-zinc-800 pt-2">
                      <span className="text-zinc-400 font-bold">Subtotal:</span>
                      <span className="text-white font-bold">₹{calculatedSubtotal.toFixed(2)}</span>
                    </div>

                    {bookingState.subscriptionDiscount > 0 && (
                      <div className="flex justify-between text-green-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Subscription Discount ({bookingState.subscriptionDiscountPercentage}%):
                        </span>
                        <span className="font-bold">-₹{bookingState.subscriptionDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {bookingState.promoDiscount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Promo Discount ({bookingState.promoCode}):
                        </span>
                        <span className="font-bold">-₹{bookingState.promoDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t border-zinc-800 pt-2 flex justify-between font-black text-base">
                      <span className="text-white">Total Amount:</span>
                      <span className="text-primary text-lg">₹{calculatedTotal.toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="gradient" onClick={handleConfirmBooking} disabled={isSubmitting} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5">
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
        <Card className="bg-[#111] border border-green-500/20 p-8 shadow-2xl rounded-2xl space-y-6 glow-box-strong">
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
          <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-900 space-y-4 glow-box-strong">
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

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3 text-sm glow-box-hover">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase">Booking Details</h4>
            <div className="flex justify-between"><span className="text-zinc-500">Customer:</span> <span className="text-white font-bold">{customerName || existingCustomerData?.name}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Phone:</span> <span className="text-primary font-bold">+91 {mobileNumber}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Device:</span> <span className="text-white font-bold">{deviceTypeName}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Date:</span> <span className="text-white font-bold">{selectedDate ? new Date(selectedDate).toLocaleDateString() : "--"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Time:</span> <span className="text-primary font-bold">{selectedSlot}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Duration:</span> <span className="text-white font-bold">{selectedDurationLabel}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Players:</span> <span className="text-white font-bold">{playerCount}</span></div>
            {playerCount > includedPlayers && (
              <div className="flex justify-between text-xs"><span className="text-zinc-600">Extra Players:</span> <span className="text-zinc-400">+₹{((playerCount - includedPlayers) * extraPlayerCharge).toFixed(2)}</span></div>
            )}
            {bookingState.subscriptionDiscount > 0 && (
              <div className="flex justify-between text-xs text-green-500"><span>Subscription Discount ({bookingState.subscriptionDiscountPercentage}%):</span> <span>-₹{bookingState.subscriptionDiscount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between border-t border-zinc-800 pt-2 font-black"><span className="text-zinc-500">Amount Paid:</span> <span className="text-white">₹{total}</span></div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button variant="gradient" onClick={() => router.push(`/booking/${bookingId}/food`)} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              ORDER FOOD & DRINKS
            </Button>
            <Button onClick={() => {
              dispatch(resetBooking());
              router.push(`/my-bookings?phone=${mobileNumber}`);
            }} variant="ghost" className="w-full border-2 border-primary text-zinc-300 hover:text-zinc-300 font-bold uppercase text-[11px] h-11 rounded-xl">
              VIEW MY BOOKINGS
            </Button>
            <Button onClick={() => {
              dispatch(resetBooking());
              router.push("/");
            }} variant="ghost" className="w-full text-zinc-300 border border-zinc-800 hover:text-zinc-400 font-bold uppercase text-[11px] h-10 rounded-xl">
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