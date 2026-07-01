"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { BreakpointLoader } from "@/components/shared/BreakpointLoader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Users,
  Plus,
  Minus,
  Phone,
  User,
  Mail,
  ShieldCheck,
  RefreshCw,
  Cake,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import {
  getDeviceTypesWithAvailability,
  checkFlexibleAvailability,
  checkCustomerExists
} from "@/app/(customer)/booking/actions";
import { createWalkInBooking } from "../actions";
import { formatDateForDB, formatDateForDisplay, handleDobInput, isValidDateDDMMYYYY } from "@/lib/utils/dates";
import {
  generateStartTimes,
  filterPastTimeSlots,
  generateDurationOptions,
  calculateEndTime,
  getMaxDurationForStartTime,
  calculatePrice,
  isTimeSlotWithinRange
} from "@/lib/utils/timeSlots";

export default function WalkInBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Device, 2: Slot, 3: Customer Lookup/Form, 4: Confirm

  // Device selection
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<any>(null);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // Slot selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const proceedButtonRef = useRef<HTMLDivElement>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 1 hour in minutes
  const [availableStartTimes, setAvailableStartTimes] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Player count
  const [playerCount, setPlayerCount] = useState(1);

  // Customer details flow states
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDob, setCustomerDob] = useState("");
  const [showFullRegistrationFields, setShowFullRegistrationFields] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  const allStartTimes = useMemo(() => generateStartTimes(), []);
  const allDurations = useMemo(() => generateDurationOptions(), []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isDayDisabled = (day: Date) => {
    return day < today || day.getMonth() !== today.getMonth() || day.getFullYear() !== today.getFullYear();
  };

  // Filter out past time slots for today
  const availableStartTimesForDate = useMemo(() => {
    if (!selectedDate) return allStartTimes;
    return filterPastTimeSlots(allStartTimes, selectedDate);
  }, [allStartTimes, selectedDate]);

  const endTime = useMemo(() => {
    if (!selectedStartTime) return null;
    return calculateEndTime(selectedStartTime, selectedDuration);
  }, [selectedStartTime, selectedDuration]);

  const maxDurationForSelectedStartTime = useMemo(() => {
    if (!selectedStartTime) return 300;
    return getMaxDurationForStartTime(selectedStartTime);
  }, [selectedStartTime]);

  const filteredDurations = useMemo(() => {
    if (!selectedStartTime) return allDurations;
    return allDurations.filter(d => d.value <= maxDurationForSelectedStartTime);
  }, [allDurations, maxDurationForSelectedStartTime, selectedStartTime]);

  useEffect(() => {
    loadDeviceTypes();
  }, []);

  useEffect(() => {
    if (selectedDeviceType && selectedDate) {
      loadAvailability();
    }
  }, [selectedDeviceType, selectedDate, selectedDuration]);

  // Reset start time if it is no longer available when date/duration changes
  useEffect(() => {
    if (selectedStartTime && availableStartTimes.size > 0 && !availableStartTimes.has(selectedStartTime)) {
      setSelectedStartTime(null);
    }
  }, [availableStartTimes, selectedStartTime]);

  const loadDeviceTypes = async () => {
    setLoadingDevices(true);
    const result = await getDeviceTypesWithAvailability();
    if (result.success) {
      setDeviceTypes(result.deviceTypes || []);
    }
    setLoadingDevices(false);
  };

  const loadAvailability = async () => {
    if (!selectedDeviceType || !selectedDate) return;
    setLoadingSlots(true);
    const dateString = selectedDate.toISOString().split("T")[0];

    try {
      const result = await checkFlexibleAvailability(dateString, selectedDeviceType.id, selectedDuration);
      if (result.success && result.availableStartTimes) {
        setAvailableStartTimes(new Set(result.availableStartTimes));
      } else {
        setAvailableStartTimes(new Set());
      }
    } catch (err) {
      console.error("Error loading availability:", err);
      setAvailableStartTimes(new Set());
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectDeviceType = (deviceType: any) => {
    setSelectedDeviceType(deviceType);
    setPlayerCount(deviceType.included_players || 1);
    setStep(2);
  };

  const handleCustomerPhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number: exactly 10 digits
    const phoneDigits = customerPhone.trim();
    if (!phoneDigits || !/^\d{10}$/.test(phoneDigits)) {
      toast.error("Invalid Entry", { description: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setCheckingProfile(true);
    const result = await checkCustomerExists(customerPhone.trim());

    if (result.exists && result.customer) {
      setCustomerName(result.customer.name);
      setCustomerEmail(result.customer.email || "");
      // Convert DOB from database format (YYYY-MM-DD) to display format (DD-MM-YYYY)
      if (result.customer.date_of_birth) {
        setCustomerDob(formatDateForDisplay(result.customer.date_of_birth));
      }
      toast.success("Profile Authenticated", { description: `Welcome back, ${result.customer.name}! Adjust players if required on final step.` });
      setStep(4);
    } else {
      toast.info("New Profile Detected", { description: "Please complete registration parameters below." });
      setShowFullRegistrationFields(true);
    }
    setCheckingProfile(false);
  };

  const handleManualRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Validation Error", { description: "Full customer name field specification is required." });
      return;
    }
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !selectedStartTime || !endTime) {
      toast.error("Please fill in customer name, phone number, and choose a valid time slot");
      return;
    }

    setSubmitting(true);

    const extraPlayersCount = Math.max(0, playerCount - (selectedDeviceType?.included_players || 1));
    const durationHours = selectedDuration / 60;
    const extraPlayerCharge = extraPlayersCount * (Number(selectedDeviceType?.extra_player_charge) || 0) * durationHours;
    const baseRate = calculatePrice(Number(selectedDeviceType?.regular_hourly_rate) || 0, selectedDuration);
    const total = baseRate + extraPlayerCharge;

    // Validate DOB
    if (!isValidDateDDMMYYYY(customerDob)) {
      toast.error("Invalid Date of Birth", {
        description: "Please enter a valid date in DD-MM-YYYY format"
      });
      setSubmitting(false);
      return;
    }

    const formattedDob = formatDateForDB(customerDob);
    if (!formattedDob) {
      toast.error("Invalid Date of Birth", {
        description: "Please check the date format"
      });
      setSubmitting(false);
      return;
    }

    const result = await createWalkInBooking({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || null,
      customerDob: formattedDob,
      deviceTypeId: selectedDeviceType.id,
      deviceTypeName: selectedDeviceType.display_name,
      selectedDate: selectedDate.toISOString().split("T")[0],
      selectedSlot: `${selectedStartTime} - ${endTime}`,
      slotStartTime: selectedStartTime,
      slotEndTime: endTime,
      hourlyRate: Number(selectedDeviceType.regular_hourly_rate) || 0,
      playerCount,
      includedPlayers: selectedDeviceType.included_players,
      extraPlayerCharge: Number(selectedDeviceType.extra_player_charge),
      subtotal: baseRate,
      total
    });

    setSubmitting(false);

    if (result.success) {
      toast.success("Walk-in booking created successfully!");
      router.push("/admin/bookings");
    } else {
      toast.error("Failed to create booking", { description: result.error });
    }
  };

  const extraPlayersCount = Math.max(0, playerCount - (selectedDeviceType?.included_players || 1));
  const durationHours = selectedDuration / 60;
  const extraPlayerCharge = extraPlayersCount * (Number(selectedDeviceType?.extra_player_charge) || 0) * durationHours;
  const baseRate = calculatePrice(Number(selectedDeviceType?.regular_hourly_rate) || 0, selectedDuration);
  const totalAmount = baseRate + extraPlayerCharge;

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = handleDobInput(e.target.value);
    setCustomerDob(formatted);
  };

  const selectedDurationLabel = useMemo(() => {
    const duration = allDurations.find(d => d.value === selectedDuration);
    return duration?.label || "";
  }, [selectedDuration, allDurations]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={() => {
                if (step === 4) {
                  setStep(3);
                } else if (step > 1) {
                  setStep(step - 1);
                } else {
                  router.push("/admin/bookings");
                }
              }}
              className="bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step > 1 ? "Back" : "Cancel"}
            </Button>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Create Walk-In Booking
            </h1>
          </div>
        </div>

        {/* Progress Steps HUD Track */}
        <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto select-none">
          {[
            { num: 1, label: "Device" },
            { num: 2, label: "Slot" },
            { num: 3, label: "Customer" },
            { num: 4, label: "Confirm" }
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step >= s.num
                    ? "bg-primary text-black"
                    : "bg-zinc-900 text-muted-content border border-zinc-800"
                    }`}
                >
                  {s.num}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${step >= s.num ? "text-primary" : "text-muted-content"
                  }`}>
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`h-0.5 flex-1 mx-2 ${step > s.num ? "bg-primary" : "bg-zinc-900"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Device Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase text-muted-content">Select Device Type</h2>
            {loadingDevices ? (
              <div className="flex items-center justify-center h-64">
                <BreakpointLoader size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deviceTypes.map((deviceType) => {
                  const isAvailable = (deviceType.available_devices_count || 0) > 0;
                  return (
                    <Card
                      key={deviceType.id}
                      className={`bg-[var(--surface)] border p-4 cursor-pointer transition-all ${isAvailable
                        ? "border-zinc-900 hover:border-primary"
                        : "border-zinc-900 opacity-50 cursor-not-allowed"
                        }`}
                      onClick={() => isAvailable && handleSelectDeviceType(deviceType)}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-sm uppercase">{deviceType.display_name}</h3>
                            <p className="text-label flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              {deviceType.included_players} included • Max {deviceType.max_players}
                            </p>
                          </div>
                          <span className={`text-xs font-black px-2 py-1 rounded ${isAvailable ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                            }`}>
                            {deviceType.available_devices_count} AVAILABLE
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-black text-primary">₹{Number(deviceType.regular_hourly_rate)}</span>
                          <span className="text-xs text-muted-content">/hour</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Slot Selection */}
        {step === 2 && selectedDeviceType && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase text-muted-content">Select Date & Time</h2>
              <p className="text-sm text-muted-content mt-1">
                Selected Device: <span className="text-white font-bold">{selectedDeviceType.display_name}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Date Picker */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-secondary-content uppercase tracking-widest pl-1">📅 Select Date</h3>
                <Card className="bg-[#111] border border-zinc-900 p-4 w-full flex justify-center rounded-2xl">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={isDayDisabled}
                  />
                </Card>
              </div>

              {/* Duration Selection */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-secondary-content uppercase tracking-widest pl-1">⏱️ Duration</h3>
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {filteredDurations.map((duration) => {
                    const isSelected = selectedDuration === duration.value;
                    const price = calculatePrice(Number(selectedDeviceType.regular_hourly_rate) || 0, duration.value);
                    return (
                      <button
                        key={duration.value}
                        onClick={() => setSelectedDuration(duration.value)}
                        className={`w-full p-3 border text-left rounded-xl transition-all duration-300 ${isSelected
                          ? "bg-gradient-to-r from-primary via-yellow-400 to-primary border-transparent text-black shadow-[0_4px_20px_rgba(255,193,7,0.4)]"
                          : "bg-[#111] border-zinc-900 text-zinc-300 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-yellow-400/10 hover:shadow-[0_0_15px_rgba(255,193,7,0.2)]"
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">{duration.label}</span>
                          <span className={`text-xs font-black ${isSelected ? "text-black" : "text-primary"}`}>
                            ₹{price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Time Selection */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-secondary-content uppercase tracking-widest pl-1">🕒 Start Time</h3>
                {loadingSlots ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <p className="text-xs text-secondary-content">Checking availability...</p>
                  </div>
                ) : availableStartTimesForDate.length === 0 ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-2 text-center px-4">
                    <Clock className="h-8 w-8 text-zinc-700" />
                    <p className="text-sm text-muted-content font-bold">No time slots available</p>
                    <p className="text-xs text-muted-content">Try selecting a different date or duration</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {availableStartTimesForDate.map((time) => {
                      const isAvailable = availableStartTimes.has(time);
                      const isSelected = selectedStartTime ? isTimeSlotWithinRange(time, selectedStartTime, selectedDuration) : false;
                      return (
                        <button
                          key={time}
                          disabled={!isAvailable}
                          onClick={() => {
                            setSelectedStartTime(time);
                            setTimeout(() => {
                              proceedButtonRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "end"
                              });
                            }, 100);
                          }}
                          className={`w-full p-3 border text-left rounded-xl transition-all duration-300 text-sm font-bold ${!isAvailable
                            ? "bg-zinc-950/20 border-zinc-950 text-zinc-800 cursor-not-allowed"
                            : isSelected
                              ? "bg-gradient-to-r from-primary via-yellow-400 to-primary border-transparent text-black shadow-[0_4px_20px_rgba(255,193,7,0.4)]"
                              : "bg-[#111] border-zinc-900 text-zinc-300 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-yellow-400/10 hover:shadow-[0_0_15px_rgba(255,193,7,0.2)]"
                            }`}
                        >
                          {time} - {calculateEndTime(time, 30)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div ref={proceedButtonRef} className="flex flex-col items-end mt-8 gap-2">
              {!selectedStartTime && (
                <p className="text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl max-w-sm text-right">
                  ⚠️ Please select a start time to proceed.
                </p>
              )}
              <Button
                disabled={!selectedDate || !selectedStartTime || loadingSlots}
                onClick={() => {
                  setStep(3);
                  setShowFullRegistrationFields(false);
                }}
                className="px-8 bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-xl transition-all active:scale-[0.99]"
              >
                Proceed to Customer Details <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Progressive Customer Profile Form */}
        {step === 3 && selectedDeviceType && selectedStartTime && (
          <div className="space-y-6 max-w-xl mx-auto">

            {/* Phase 1: Primary Mobile Verification */}
            {!showFullRegistrationFields ? (
              <Card className="bg-[var(--surface)] border border-zinc-900 p-6 space-y-6 rounded-2xl shadow-2xl animate-in fade-in duration-200">
                <div className="border-b border-zinc-900 pb-4 space-y-1">
                  <h3 className="text-lg font-black uppercase text-white tracking-tight">WALK-IN PROFILE IDENTIFICATION</h3>
                  <p className="text-xs text-secondary-content font-medium">Verify the customer's mobile number to load profiles automatically.</p>
                </div>

                <form onSubmit={handleCustomerPhoneLookup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[11px] font-black text-muted-content uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-content" /> Mobile Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-content border-r border-zinc-900 pr-2">+91</span>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                        className="bg-[var(--background)] border-zinc-900 h-12 pl-12 text-sm text-white font-mono tracking-wider focus-visible:ring-primary rounded-xl"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={checkingProfile} className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-xl">
                    {checkingProfile ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "VERIFY CUSTOMER PROFILE"} <ChevronRight className="h-4 w-4 stroke-[3]" />
                  </Button>
                </form>

                <div className="pt-2 flex gap-2 items-center text-[10px] text-muted-content justify-center border-t border-zinc-950">
                  <ShieldCheck className="h-4 w-4 text-zinc-700" /><span>Instant index lookup map layers running safely.</span>
                </div>
              </Card>
            ) : (
              /* Phase 2: Supplemental Registration Form (Triggered for new entries) */
              <Card className="bg-[var(--surface)] border border-zinc-900 p-6 space-y-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="border-b border-zinc-900 pb-4 space-y-1">
                  <h3 className="text-lg font-black uppercase text-white tracking-tight">WALK-IN ACCOUNT SIGNUP</h3>
                  <p className="text-xs text-secondary-content font-medium">Please generate contact tokens to instantiate profile logs.</p>
                </div>

                <div className="bg-[var(--background)] p-3.5 border border-zinc-900 rounded-xl flex items-center justify-between gap-4 text-xs select-none">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-muted-content uppercase tracking-widest block">Customer Phone Number:</span>
                    <span className="text-primary font-mono font-black tracking-wider">+91 {customerPhone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullRegistrationFields(false)}
                    className="px-3 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-black uppercase text-muted-content hover:text-primary rounded-lg tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Change Number
                  </button>
                </div>

                <form onSubmit={handleManualRegistrationSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[11px] font-black text-muted-content uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-content" /> Customer Name *
                    </Label>
                    <Input
                      id="name"
                      required
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer's full name"
                      className="bg-[var(--background)] border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-[11px] font-black text-muted-content uppercase tracking-wider flex items-center gap-1.5">
                      <Cake className="h-3.5 w-3.5 text-muted-content" /> Date of Birth (DD-MM-YYYY)
                    </Label>
                    <Input
                      id="dob"
                      type="text"
                      placeholder="DD-MM-YYYY"
                      required
                      maxLength={10}
                      value={customerDob}
                      onChange={handleDobChange}
                      className="bg-[var(--background)] border-zinc-900 h-12 text-sm text-white font-mono tracking-wider focus-visible:ring-primary rounded-xl placeholder:text-zinc-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[11px] font-black text-muted-content uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-content" /> Email (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@domain.com"
                      className="bg-[var(--background)] border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary rounded-xl"
                    />
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button type="submit" className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1 shadow-lg">
                      PROCEED TO ORDER SUMMARY <ChevronRight className="h-4 w-4 stroke-[3]" />
                    </Button>
                  </div>
                </form>
              </Card>
            )}

          </div>
        )}

        {/* Step 4: Confirmation Summary Panel */}
        {step === 4 && selectedDeviceType && selectedStartTime && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-black uppercase text-muted-content">Confirm Booking</h2>

            <Card className="bg-[var(--surface)] border border-zinc-900 p-6 space-y-6 rounded-2xl">


              {/* Summary Breakdown Fields Matrix */}
              <div className="space-y-4 text-sm pt-2">
                <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                  <span className="text-secondary-content">Customer Name:</span>
                  <span className="text-white font-bold">{customerName}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                  <span className="text-secondary-content">Phone Number:</span>
                  <span className="text-white font-bold">{customerPhone}</span>
                </div>
                {customerEmail && (
                  <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                    <span className="text-secondary-content">Email:</span>
                    <span className="text-white font-bold">{customerEmail}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                  <span className="text-secondary-content">Device Configuration:</span>
                  <span className="text-white font-bold uppercase">{selectedDeviceType.display_name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                  <span className="text-secondary-content">Target Date:</span>
                  <span className="text-white font-bold">{selectedDate.toDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                  <span className="text-secondary-content">Selected Time Window:</span>
                  <span className="text-primary font-bold">{selectedStartTime} - {endTime} ({selectedDurationLabel})</span>
                </div>
              </div>
              <div className="bg-[var(--background)]/40 p-4 border border-zinc-900 rounded-xl space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-content tracking-wider block">
                  Assign Player Allocation Count
                </Label>
                <div className="flex items-center justify-between bg-[var(--background)] border border-zinc-900/60 rounded-lg p-3">
                  <p className="text-xs text-secondary-content font-medium">
                    {selectedDeviceType.included_players} included • Max {selectedDeviceType.max_players}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => playerCount > 1 && setPlayerCount(playerCount - 1)}
                      disabled={playerCount <= 1}
                      className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-white disabled:opacity-30 flex items-center justify-center transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-base font-black text-white w-6 text-center font-mono">{playerCount}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (playerCount >= selectedDeviceType.max_players) {
                          toast.error(`Maximum ${selectedDeviceType.max_players} players only`);
                        } else {
                          setPlayerCount(playerCount + 1);
                        }
                      }}
                      disabled={playerCount >= selectedDeviceType.max_players}
                      className="w-7 h-7 rounded-md bg-gradient-primary text-[var(--button-text)] flex items-center justify-center font-bold active:scale-95 transition-all"
                    >
                      <Plus className="h-3 w-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm border-t border-zinc-900 pt-4 bg-[var(--background)]/20 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-secondary-content">Base Station Rate:</span>
                  <span className="text-white font-bold">₹{baseRate}.00</span>
                </div>
                {extraPlayersCount > 0 && (
                  <div className="flex justify-between animate-in slide-in-from-top-2 duration-150">
                    <span className="text-secondary-content">Extra Player Charge Layer ({extraPlayersCount}):</span>
                    <span className="text-primary font-bold">₹{Math.round(extraPlayerCharge)}.00</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-zinc-900 font-black text-lg">
                  <span className="text-white uppercase text-xs tracking-wider">Gross Total Amount:</span>
                  <span className="text-primary text-2xl font-mono">₹{Math.round(totalAmount)}.00</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-900/60">
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 border-zinc-800 bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black h-12 rounded-xl text-xs uppercase"
                >
                  Back to Registration
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase h-12 rounded-xl text-xs shadow-xl transition-all active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-black" />
                      Creating Log Entry...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
