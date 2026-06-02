"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setSlot, setPricing, setSlotLockExpiry, setBookingId, setPlayerCount } from "@/lib/redux/slices/bookingSlice";
import { checkFlexibleAvailability, initializeSoftLockReservation as createSoftLockTransaction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Loader2, ChevronRight, X, Plus, Minus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  generateStartTimes,
  generateDurationOptions,
  calculateEndTime,
  getMaxDurationForStartTime,
  calculatePrice,
  isWithinBusinessHours
} from "@/lib/utils/timeSlots";

export default function FlexibleSlotBookingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { deviceTypeId, deviceTypeName, hourlyRate, addons, playerCount, includedPlayers, maxPlayers, extraPlayerCharge } = useAppSelector((state) => state.booking);

  const [calendarDay, setCalendarDay] = useState<Date | undefined>(undefined);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 1 hour in minutes
  const [availableStartTimes, setAvailableStartTimes] = useState<Set<string>>(new Set());
  const [queryingDb, setQueryingDb] = useState(false);
  const [submittingLock, setSubmittingLock] = useState(false);

  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  const [mobileStartTimeOpen, setMobileStartTimeOpen] = useState(false);
  const [mobileDurationOpen, setMobileDurationOpen] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const allStartTimes = useMemo(() => generateStartTimes(), []);
  const allDurations = useMemo(() => generateDurationOptions(), []);

  useEffect(() => {
    setMounted(true);
    setCalendarDay(new Date());
  }, []);

  // Check availability when date or duration changes
  useEffect(() => {
    if (!mounted || !calendarDay || !deviceTypeId) return;
    checkAvailability();
  }, [calendarDay, selectedDuration, mounted, deviceTypeId]);

  const checkAvailability = async () => {
    if (!calendarDay || !deviceTypeId) return;
    setQueryingDb(true);

    const dateStr = calendarDay.toISOString().split("T")[0];
    const res = await checkFlexibleAvailability(dateStr, deviceTypeId, selectedDuration);

    if (res.success && res.availableStartTimes) {
      setAvailableStartTimes(new Set(res.availableStartTimes));
    } else {
      setAvailableStartTimes(new Set());
    }
    setQueryingDb(false);
  };

  const endTime = useMemo(() => {
    if (!selectedStartTime) return null;
    return calculateEndTime(selectedStartTime, selectedDuration);
  }, [selectedStartTime, selectedDuration]);

  const maxDurationForSelectedStartTime = useMemo(() => {
    if (!selectedStartTime) return 300; // 5 hours in minutes
    return getMaxDurationForStartTime(selectedStartTime);
  }, [selectedStartTime]);

  const filteredDurations = useMemo(() => {
    if (!selectedStartTime) return allDurations;
    return allDurations.filter(d => d.value <= maxDurationForSelectedStartTime);
  }, [allDurations, maxDurationForSelectedStartTime, selectedStartTime]);

  // Pricing calculations
  const additivesCostAggregated = useMemo(() => {
    return addons.reduce((sum, asset) => sum + (asset.price * asset.quantity), 0);
  }, [addons]);

  const extraPlayersCount = Math.max(0, playerCount - includedPlayers);
  const durationHours = selectedDuration / 60; // Convert minutes to hours
  const extraPlayersCharge = extraPlayersCount * extraPlayerCharge * durationHours;
  const baselineSubtotal = calculatePrice(hourlyRate || 0, selectedDuration);
  const aggregatedPayableTotal = baselineSubtotal + extraPlayersCharge + additivesCostAggregated;

  const selectedDurationLabel = useMemo(() => {
    const duration = allDurations.find(d => d.value === selectedDuration);
    return duration?.label || "";
  }, [selectedDuration, allDurations]);

  const handleRegisterTransactionLock = async () => {
    if (!calendarDay || !selectedStartTime || !endTime || !deviceTypeId) return;

    // Validate within business hours
    if (!isWithinBusinessHours(selectedStartTime, endTime)) {
      toast.error("Selected time range exceeds business hours");
      return;
    }

    setSubmittingLock(true);
    const dateQueryString = calendarDay.toISOString().split("T")[0];
    const slotLabel = `${selectedStartTime} - ${endTime}`;

    const res = await createSoftLockTransaction({
      deviceId: deviceTypeId!,
      deviceName: deviceTypeName || "Device Type",
      deviceType: "gaming",
      hourlyRate: baselineSubtotal,
      date: dateQueryString,
      slotLabel,
      start: selectedStartTime,
      end: endTime,
      addons,
      subtotal: baselineSubtotal,
      total: aggregatedPayableTotal,
      durationMinutes: selectedDuration
    });

    if (res.success && res.bookingId && res.expiresAt) {
      dispatch(setSlot({ date: dateQueryString, slot: slotLabel, startTime: selectedStartTime, endTime }));
      dispatch(setBookingId(res.bookingId));
      dispatch(setSlotLockExpiry(res.expiresAt));
      dispatch(setPricing({ subtotal: baselineSubtotal, subscriptionDiscount: 0, promoDiscount: 0, total: aggregatedPayableTotal }));
      router.push("/booking/auth");
    } else {
      toast.error(res.error);
    }
    setSubmittingLock(false);
  };

  if (!mounted) return null;

  const isTimeAvailable = (time: string) => availableStartTimes.has(time);
  const canProceed = calendarDay && selectedStartTime && endTime && isTimeAvailable(selectedStartTime);

  return (
    <div className="max-w-md md:max-w-7xl mx-auto py-2 px-1 pb-28 md:pb-12">

      {/* Progress Steps */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pb-6 px-2 select-none">
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">1</div>
          <span className="text-[8px] font-black uppercase text-primary tracking-wider">Date</span>
        </div>
        <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">2</div>
          <span className="text-[8px] font-black uppercase text-primary tracking-wider">Time</span>
        </div>
        <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">3</div>
          <span className="text-[8px] font-black uppercase text-primary tracking-wider">Duration</span>
        </div>
        <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-500 font-bold text-[9px] flex items-center justify-center border border-zinc-800">4</div>
          <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Summary</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Device Info */}
          <div className="bg-[#111] border border-zinc-900 rounded-xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 text-primary rounded-lg">
                <Clock className="h-4 w-4"/>
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-xs sm:text-sm text-white uppercase truncate">{deviceTypeName || "Gaming Device"}</h4>
                <p className="text-zinc-500 text-[10px] font-bold mt-0.5">₹{hourlyRate || 0}/hour</p>
              </div>
            </div>
            <Button onClick={() => router.push("/booking")} variant="outline" className="border-zinc-800 text-[10px] uppercase h-8 px-3 text-zinc-400">
              Change
            </Button>
          </div>

          {/* Info Banner */}
          <Card className="bg-blue-500/5 border-blue-500/20 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-300">Flexible Booking</p>
                <p className="text-xs text-blue-400/80">Book from 30 minutes to 5 hours. Choose your preferred start time and duration.</p>
              </div>
            </div>
          </Card>

          {/* Mobile Flow */}
          <div className="space-y-3 md:hidden">
            <div onClick={() => setMobileCalendarOpen(true)} className="bg-[#111] border border-zinc-900 p-4 rounded-xl flex justify-between items-center cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-[8px] font-black text-zinc-500 uppercase block">Select Date</span>
                <span className="text-xs font-black text-white">{calendarDay ? calendarDay.toLocaleDateString() : "Choose Date"}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>

            <div onClick={() => setMobileStartTimeOpen(true)} className="bg-[#111] border border-zinc-900 p-4 rounded-xl flex justify-between items-center cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-[8px] font-black text-zinc-500 uppercase block">Start Time</span>
                <span className="text-xs font-black text-primary">{selectedStartTime || "Choose Start Time"}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>

            <div onClick={() => setMobileDurationOpen(true)} className="bg-[#111] border border-zinc-900 p-4 rounded-xl flex justify-between items-center cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-[8px] font-black text-zinc-500 uppercase block">Duration</span>
                <span className="text-xs font-black text-white">{selectedDurationLabel}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>

            <div onClick={() => setMobileSummaryOpen(true)} className="bg-[#111] border border-zinc-900 p-4 rounded-xl flex justify-between items-center cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-[8px] font-black text-zinc-500 uppercase block">Booking Summary</span>
                <span className="text-xs font-medium text-zinc-400">Review before checkout</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>

            <Button disabled={!canProceed || submittingLock} onClick={handleRegisterTransactionLock} className="w-full bg-primary text-black font-black uppercase text-xs py-5 rounded-xl flex items-center justify-center gap-1 mt-4">
              {submittingLock ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continue <ChevronRight className="h-4 w-4 stroke-[3]" />
            </Button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-3 gap-6 items-start">
            {/* Date Picker */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">📅 Select Date</h3>
              <Card className="bg-[#111] border border-zinc-900 p-4 w-full flex justify-center rounded-2xl">
                <Calendar mode="single" selected={calendarDay} onSelect={setCalendarDay} disabled={(day) => day < new Date(new Date().setHours(0,0,0,0))} />
              </Card>
            </div>

            {/* Start Time Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">🕒 Start Time</h3>
              {queryingDb ? (
                <div className="h-96 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950">
                  {allStartTimes.map((time) => {
                    const isAvailable = isTimeAvailable(time);
                    const isSelected = selectedStartTime === time;
                    return (
                      <button
                        key={time}
                        disabled={!isAvailable}
                        onClick={() => setSelectedStartTime(time)}
                        className={`w-full p-3 border text-left rounded-xl transition-all text-sm font-bold ${
                          !isAvailable
                            ? "bg-zinc-950/20 border-zinc-950 text-zinc-800 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary border-transparent text-black"
                            : "bg-[#111] border-zinc-900 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Duration Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">⏱️ Duration</h3>
              <div className="space-y-1.5">
                {filteredDurations.map((duration) => {
                  const isSelected = selectedDuration === duration.value;
                  const price = calculatePrice(hourlyRate || 0, duration.value);
                  return (
                    <button
                      key={duration.value}
                      onClick={() => setSelectedDuration(duration.value)}
                      className={`w-full p-3 border text-left rounded-xl transition-all ${
                        isSelected
                          ? "bg-primary border-transparent text-black"
                          : "bg-[#111] border-zinc-900 text-zinc-300 hover:border-zinc-700"
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
          </div>
        </div>

        {/* Desktop Sidebar Summary */}
        <div className="hidden lg:block w-[360px] flex-shrink-0">
          <Card className="bg-[#111] border border-zinc-900 p-6 text-white space-y-6 shadow-2xl rounded-2xl sticky top-24">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-3">Booking Summary</h3>

            <div className="space-y-4 text-xs text-zinc-400 border-b border-zinc-900 pb-3">
              <div className="flex justify-between">
                <span>Date:</span>
                <strong className="text-white font-bold">{calendarDay ? calendarDay.toDateString() : "Not Selected"}</strong>
              </div>
              <div className="flex justify-between">
                <span>Start Time:</span>
                <strong className="text-primary font-black">{selectedStartTime || "Not Selected"}</strong>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <strong className="text-white font-bold">{selectedDurationLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span>End Time:</span>
                <strong className="text-primary font-black">{endTime || "--"}</strong>
              </div>
              <div className="flex justify-between">
                <span>Device:</span>
                <strong className="text-white uppercase truncate max-w-[160px]">{deviceTypeName || "N/A"}</strong>
              </div>
            </div>

            {/* Player Selection */}
            <div className="border-b border-zinc-900 pb-4">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-3">Number of Players</h4>
              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-xs text-zinc-500">
                    {includedPlayers} included • Max {maxPlayers}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playerCount > 1 && dispatch(setPlayerCount(playerCount - 1))}
                    disabled={playerCount <= 1}
                    className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xl font-black text-white w-8 text-center">{playerCount}</span>
                  <button
                    onClick={() => {
                      if (playerCount >= maxPlayers) {
                        toast.error(`Maximum ${maxPlayers} players only`);
                      } else {
                        dispatch(setPlayerCount(playerCount + 1));
                      }
                    }}
                    disabled={playerCount >= maxPlayers}
                    className="w-7 h-7 rounded-md bg-primary border border-transparent text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-hover transition-all flex items-center justify-center font-bold"
                  >
                    <Plus className="h-3 w-3 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Base Rate ({selectedDurationLabel})</span>
                <span className="text-white font-bold">₹{Math.round(baselineSubtotal)}.00</span>
              </div>
              {extraPlayersCount > 0 && (
                <div className="flex justify-between">
                  <span>Extra Players ({extraPlayersCount} × {selectedDurationLabel})</span>
                  <span className="text-primary font-bold">₹{Math.round(extraPlayersCharge)}.00</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-zinc-900 text-white font-black">
                <span className="text-xs uppercase">Total Payable</span>
                <span className="text-2xl text-primary">₹{Math.round(aggregatedPayableTotal)}.00</span>
              </div>
            </div>

            <Button
              disabled={submittingLock || !canProceed}
              onClick={handleRegisterTransactionLock}
              className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase py-5 text-xs rounded-xl flex items-center justify-center gap-1"
            >
              {submittingLock ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continue <ChevronRight className="h-4 w-4 stroke-[3]" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Mobile Drawers */}
      {mobileCalendarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:hidden animate-in fade-in duration-150">
          <div className="bg-[#121212] border-t border-zinc-800 rounded-t-2xl w-full p-5 space-y-4 animate-in slide-in-from-bottom duration-250">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-xs font-black uppercase text-zinc-400">Select Date</span>
              <button onClick={() => setMobileCalendarOpen(false)} className="p-1.5 rounded-full bg-zinc-950 text-zinc-500">
                <X className="h-4 w-4"/>
              </button>
            </div>
            <div className="flex justify-center bg-zinc-950 p-2 rounded-xl">
              <Calendar mode="single" selected={calendarDay} onSelect={(day) => { setCalendarDay(day); setMobileCalendarOpen(false); }} disabled={(day) => day < new Date(new Date().setHours(0,0,0,0))} />
            </div>
          </div>
        </div>
      )}

      {mobileStartTimeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:hidden">
          <div className="bg-[#121212] border-t border-zinc-800 rounded-t-2xl w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-xs font-black uppercase text-zinc-400">Select Start Time</span>
              <button onClick={() => setMobileStartTimeOpen(false)} className="p-1.5 rounded-full bg-zinc-950 text-zinc-500">
                <X className="h-4 w-4"/>
              </button>
            </div>
            <div className="space-y-1.5">
              {allStartTimes.map((time) => {
                const isAvailable = isTimeAvailable(time);
                const isSelected = selectedStartTime === time;
                return (
                  <button
                    key={time}
                    disabled={!isAvailable}
                    onClick={() => { setSelectedStartTime(time); setMobileStartTimeOpen(false); }}
                    className={`w-full p-3 border text-left rounded-xl text-sm font-bold ${
                      !isAvailable
                        ? "bg-zinc-950/20 border-zinc-950 text-zinc-800"
                        : isSelected
                        ? "bg-primary text-black"
                        : "bg-[#111] text-zinc-300"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mobileDurationOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:hidden">
          <div className="bg-[#121212] border-t border-zinc-800 rounded-t-2xl w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-xs font-black uppercase text-zinc-400">Select Duration</span>
              <button onClick={() => setMobileDurationOpen(false)} className="p-1.5 rounded-full bg-zinc-950 text-zinc-500">
                <X className="h-4 w-4"/>
              </button>
            </div>
            <div className="space-y-1.5">
              {filteredDurations.map((duration) => {
                const isSelected = selectedDuration === duration.value;
                const price = calculatePrice(hourlyRate || 0, duration.value);
                return (
                  <button
                    key={duration.value}
                    onClick={() => { setSelectedDuration(duration.value); setMobileDurationOpen(false); }}
                    className={`w-full p-3 border text-left rounded-xl ${
                      isSelected ? "bg-primary text-black" : "bg-[#111] border-zinc-900 text-zinc-300"
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
        </div>
      )}

      {mobileSummaryOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:hidden">
          <div className="bg-[#121212] border-t border-zinc-800 rounded-t-2xl w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-xs font-black uppercase text-zinc-400">Summary</span>
              <button onClick={() => setMobileSummaryOpen(false)} className="p-1.5 rounded-full bg-zinc-950 text-zinc-500">
                <X className="h-4 w-4"/>
              </button>
            </div>

            {/* Player Selection Mobile */}
            <div className="border-b border-zinc-900 pb-3">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">Number of Players</h4>
              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-xs text-zinc-500">
                    {includedPlayers} included • Max {maxPlayers}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playerCount > 1 && dispatch(setPlayerCount(playerCount - 1))}
                    disabled={playerCount <= 1}
                    className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 text-white disabled:opacity-30 flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xl font-black text-white w-8 text-center">{playerCount}</span>
                  <button
                    onClick={() => {
                      if (playerCount >= maxPlayers) {
                        toast.error(`Maximum ${maxPlayers} players only`);
                      } else {
                        dispatch(setPlayerCount(playerCount + 1));
                      }
                    }}
                    disabled={playerCount >= maxPlayers}
                    className="w-8 h-8 rounded-md bg-primary text-black disabled:opacity-30 flex items-center justify-center font-bold"
                  >
                    <Plus className="h-3 w-3 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Base Rate ({selectedDurationLabel})</span>
                <span className="text-white font-bold">₹{Math.round(baselineSubtotal)}.00</span>
              </div>
              {extraPlayersCount > 0 && (
                <div className="flex justify-between">
                  <span>Extra Players ({extraPlayersCount} × {selectedDurationLabel})</span>
                  <span className="text-primary font-bold">₹{Math.round(extraPlayersCharge)}.00</span>
                </div>
              )}
              <div className="flex justify-between font-black text-white border-t border-zinc-900 pt-2">
                <span>Total Payable</span>
                <span className="text-primary">₹{Math.round(aggregatedPayableTotal)}</span>
              </div>
              <Button
                onClick={() => { setMobileSummaryOpen(false); handleRegisterTransactionLock(); }}
                disabled={!canProceed || submittingLock}
                className="w-full bg-primary text-black font-black uppercase py-4 rounded-xl text-xs mt-2"
              >
                {submittingLock ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm & Hold Slot
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
