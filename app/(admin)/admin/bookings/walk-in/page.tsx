"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, ChevronRight, Loader2, Users, Plus, Minus
} from "lucide-react";
import { toast } from "sonner";
import {
  getDeviceTypesWithAvailability,
  checkAvailabilityByDeviceType
} from "@/app/(customer)/booking/actions";
import { createWalkInBooking } from "../actions";

const staticDaylightSchedulesMatrix = [
  { id: "s1", label: "10:00 AM - 11:00 AM", start: "10:00 AM", end: "11:00 AM", tier: "Morning Slots" },
  { id: "s2", label: "11:00 AM - 12:00 PM", start: "11:00 AM", end: "12:00 PM", tier: "Morning Slots" },
  { id: "s3", label: "01:30 PM - 02:30 PM", start: "01:30 PM", end: "02:30 PM", tier: "Afternoon Slots" },
  { id: "s4", label: "02:30 PM - 03:30 PM", start: "02:30 PM", end: "03:30 PM", tier: "Afternoon Slots", peak: true },
  { id: "s5", label: "04:30 PM - 05:30 PM", start: "04:30 PM", end: "05:30 PM", tier: "Afternoon Slots" },
  { id: "s6", label: "07:00 PM - 08:00 PM", start: "07:00 PM", end: "08:00 PM", tier: "Evening R Night" },
  { id: "s7", label: "08:30 PM - 09:30 PM", start: "08:30 PM", end: "09:30 PM", tier: "Evening R Night" }
];

export default function WalkInBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Device, 2: Slot, 3: Customer, 4: Confirm

  // Device selection
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<any>(null);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // Slot selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<typeof staticDaylightSchedulesMatrix[0] | null>(null);
  const [disabledSlots, setDisabledSlots] = useState<string[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<Record<string, { available: number; total: number }>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Player count
  const [playerCount, setPlayerCount] = useState(1);

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDeviceTypes();
  }, []);

  useEffect(() => {
    if (selectedDeviceType && selectedDate) {
      loadAvailability();
    }
  }, [selectedDeviceType, selectedDate]);

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
    const result = await checkAvailabilityByDeviceType(dateString, selectedDeviceType.id);
    if (result.success) {
      setDisabledSlots(result.unavailableSlots || []);
      setSlotAvailability(result.slotAvailability || {});
    }
    setLoadingSlots(false);
  };

  const handleSelectDeviceType = (deviceType: any) => {
    setSelectedDeviceType(deviceType);
    setPlayerCount(deviceType.included_players || 1);
    setStep(2);
  };

  const handleSelectSlot = (slot: typeof staticDaylightSchedulesMatrix[0]) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please fill in customer name and phone number");
      return;
    }

    if (!/^\d{10}$/.test(customerPhone.trim())) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setSubmitting(true);

    const extraPlayersCount = Math.max(0, playerCount - (selectedDeviceType?.included_players || 1));
    const extraPlayerCharge = extraPlayersCount * (Number(selectedDeviceType?.extra_player_charge) || 0);
    const baseRate = Number(selectedDeviceType?.regular_hourly_rate) || 0;
    const total = baseRate + extraPlayerCharge;

    const result = await createWalkInBooking({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || null,
      deviceTypeId: selectedDeviceType.id,
      deviceTypeName: selectedDeviceType.display_name,
      selectedDate: selectedDate.toISOString().split("T")[0],
      selectedSlot: selectedSlot!.label,
      slotStartTime: selectedSlot!.start,
      slotEndTime: selectedSlot!.end,
      hourlyRate: baseRate,
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
  const extraPlayerCharge = extraPlayersCount * (Number(selectedDeviceType?.extra_player_charge) || 0);
  const baseRate = Number(selectedDeviceType?.regular_hourly_rate) || 0;
  const totalAmount = baseRate + extraPlayerCharge;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  router.push("/admin/bookings");
                }
              }}
              className="border-[#27272a] text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step > 1 ? "Back" : "Cancel"}
            </Button>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Create Walk-In Booking
            </h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
          {[
            { num: 1, label: "Device" },
            { num: 2, label: "Slot" },
            { num: 3, label: "Customer" },
            { num: 4, label: "Confirm" }
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                    step >= s.num
                      ? "bg-primary text-black"
                      : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                  }`}
                >
                  {s.num}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${
                  step >= s.num ? "text-primary" : "text-zinc-600"
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
            <h2 className="text-xl font-black uppercase text-zinc-400">Select Device Type</h2>
            {loadingDevices ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deviceTypes.map((deviceType) => {
                  const isAvailable = (deviceType.available_devices_count || 0) > 0;
                  return (
                    <Card
                      key={deviceType.id}
                      className={`bg-[#111] border p-4 cursor-pointer transition-all ${
                        isAvailable
                          ? "border-zinc-900 hover:border-primary"
                          : "border-zinc-900 opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => isAvailable && handleSelectDeviceType(deviceType)}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-sm uppercase">{deviceType.display_name}</h3>
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              {deviceType.included_players} included • Max {deviceType.max_players}
                            </p>
                          </div>
                          <span className={`text-xs font-black px-2 py-1 rounded ${
                            isAvailable ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {deviceType.available_devices_count} AVAILABLE
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-black text-primary">₹{Number(deviceType.regular_hourly_rate)}</span>
                          <span className="text-xs text-zinc-600">/hour</span>
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
              <h2 className="text-xl font-black uppercase text-zinc-400">Select Date & Time</h2>
              <p className="text-sm text-zinc-600 mt-1">
                Selected Device: <span className="text-white font-bold">{selectedDeviceType.display_name}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card className="bg-[#111] border border-zinc-900 p-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase mb-4">Select Date</h3>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              </Card>

              {/* Time Slots */}
              <Card className="bg-[#111] border border-zinc-900 p-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase mb-4">Select Time Slot</h3>
                {loadingSlots ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {["Morning Slots", "Afternoon Slots", "Evening R Night"].map((tier) => (
                      <div key={tier} className="space-y-2">
                        <p className="text-[9px] font-black uppercase text-zinc-600">
                          {tier}
                        </p>
                        <div className="space-y-2">
                          {staticDaylightSchedulesMatrix
                            .filter((s) => s.tier === tier)
                            .map((slot) => {
                              const isBooked = disabledSlots.includes(slot.label);
                              const availability = slotAvailability[slot.label];
                              return (
                                <button
                                  key={slot.id}
                                  disabled={isBooked}
                                  onClick={() => handleSelectSlot(slot)}
                                  className={`w-full p-3 border text-left flex justify-between items-center rounded-lg transition-all ${
                                    isBooked
                                      ? "bg-zinc-950/20 border-zinc-950 text-zinc-800 line-through cursor-not-allowed"
                                      : "bg-[#0a0a0a] border-zinc-900 text-zinc-300 hover:border-primary"
                                  }`}
                                >
                                  <span className="text-xs font-bold">{slot.label}</span>
                                  {availability && !isBooked && (
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm bg-green-500/10 text-green-400">
                                      {availability.available} LEFT
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === 3 && selectedDeviceType && selectedSlot && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-black uppercase text-zinc-400">Customer Details</h2>

            <Card className="bg-[#111] border border-zinc-900 p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-black uppercase text-zinc-500">
                  Customer Name *
                </Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="bg-[#0a0a0a] border-zinc-900 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-black uppercase text-zinc-500">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="bg-[#0a0a0a] border-zinc-900 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase text-zinc-500">
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="bg-[#0a0a0a] border-zinc-900 text-white"
                />
              </div>

              {/* Player Selection */}
              <div className="border-t border-zinc-900 pt-4">
                <Label className="text-xs font-black uppercase text-zinc-500 mb-3 block">
                  Number of Players
                </Label>
                <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">
                      {selectedDeviceType.included_players} included • Max {selectedDeviceType.max_players}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => playerCount > 1 && setPlayerCount(playerCount - 1)}
                      disabled={playerCount <= 1}
                      className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all flex items-center justify-center"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xl font-black text-white w-10 text-center">{playerCount}</span>
                    <button
                      onClick={() => {
                        if (playerCount >= selectedDeviceType.max_players) {
                          toast.error(`Maximum ${selectedDeviceType.max_players} players only`);
                        } else {
                          setPlayerCount(playerCount + 1);
                        }
                      }}
                      disabled={playerCount >= selectedDeviceType.max_players}
                      className="w-8 h-8 rounded-md bg-primary text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-hover transition-all flex items-center justify-center font-bold"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(4)}
                className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase"
              >
                Continue to Confirm
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && selectedDeviceType && selectedSlot && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-black uppercase text-zinc-400">Confirm Booking</h2>

            <Card className="bg-[#111] border border-zinc-900 p-6 space-y-6">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Customer Name:</span>
                  <span className="text-white font-bold">{customerName}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Phone Number:</span>
                  <span className="text-white font-bold">{customerPhone}</span>
                </div>
                {customerEmail && (
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500">Email:</span>
                    <span className="text-white font-bold">{customerEmail}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Device:</span>
                  <span className="text-white font-bold">{selectedDeviceType.display_name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Date:</span>
                  <span className="text-white font-bold">{selectedDate.toDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Time Slot:</span>
                  <span className="text-primary font-bold">{selectedSlot.label}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Number of Players:</span>
                  <span className="text-white font-bold">{playerCount}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm border-t border-zinc-900 pt-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Base Rate:</span>
                  <span className="text-white font-bold">₹{baseRate}.00</span>
                </div>
                {extraPlayersCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Extra Players ({extraPlayersCount}):</span>
                    <span className="text-primary font-bold">₹{extraPlayerCharge}.00</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-zinc-900 font-black text-lg">
                  <span className="text-white uppercase">Total Amount:</span>
                  <span className="text-primary text-2xl">₹{totalAmount}.00</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-900">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1 border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary-hover text-black font-black uppercase"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
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
