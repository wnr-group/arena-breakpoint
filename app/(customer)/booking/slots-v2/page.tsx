"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setSlot, setPricing, setSlotHold, setPlayerCount, setDuration, setHappyHour } from "@/lib/redux/slices/bookingSlice";
import { checkFlexibleAvailability, initializeSoftLockReservation as createSoftLockTransaction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateSelector } from "@/components/booking/DateSelector";
import { Clock, ChevronRight, X, Plus, Minus, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import {
  formatLocalDate,
  isDateWithinBookingWindow,
  BOOKING_WINDOW_ERROR
} from "@/lib/utils/dates";
import {
  generateStartTimes,
  filterPastTimeSlots,
  generateDurationOptions,
  calculateEndTime,
  getMaxDurationForStartTime,
  calculatePrice,
  isWithinBusinessHours,
  isTimeSlotWithinRange,
  crossesMidnight,
  bookingEndDate
} from "@/lib/utils/timeSlots";
import { useHappyHours } from "@/lib/hooks/useHappyHours";
import { formatCurrency } from "@/lib/currency";
import { extraPlayersCharge, perExtraPlayerCharge } from "@/lib/payments/money";

export default function FlexibleSlotBookingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { deviceTypeId, deviceTypeName, hourlyRate, addons, playerCount, includedPlayers, maxPlayers, extraPlayerCharge, hydrated, bookingId, holdToken } = useAppSelector((state) => state.booking);

  const [calendarDay, setCalendarDay] = useState<Date | undefined>(undefined);
  const confirmButtonRef = useRef<HTMLDivElement>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 1 hour in minutes
  const [availableStartTimes, setAvailableStartTimes] = useState<Set<string>>(new Set());
  const [queryingDb, setQueryingDb] = useState(false);
  const [submittingLock, setSubmittingLock] = useState(false);

  const [mobileStartTimeOpen, setMobileStartTimeOpen] = useState(false);
  const [mobileDurationOpen, setMobileDurationOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Happy Hours integration
  const { checkHappyHour, calculateDiscount, hasActiveRules } = useHappyHours();

  const allStartTimes = useMemo(() => generateStartTimes(), []);
  const allDurations = useMemo(() => generateDurationOptions(), []);

  // Filter out past time slots for today
  const availableStartTimesForDate = useMemo(() => {
    if (!calendarDay) return allStartTimes;
    return filterPastTimeSlots(allStartTimes, calendarDay);
  }, [allStartTimes, calendarDay]);

  useEffect(() => {
    setMounted(true);
    setCalendarDay(new Date());
  }, []);

  /**
   * Redirect if no device type selected.
   *
   * Waits for `hydrated`: Redux is empty on the first tick of every page load, and
   * this effect runs before the store is refilled from sessionStorage. Firing on
   * that empty tick is what sent a refreshed customer here - via "choose an
   * alternative time slot" - straight back to device selection a moment later.
   */
  useEffect(() => {
    if (!hydrated || deviceTypeId) return;
    console.warn('[Frontend] No device type selected, redirecting to booking page');
    router.push('/booking');
  }, [hydrated, deviceTypeId, router]);

  // Disable body scroll when mobile drawers are open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mainEl = document.querySelector('main');
    const htmlEl = document.documentElement;
    if (mobileDurationOpen || mobileStartTimeOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
      htmlEl.style.overflow = 'hidden';
      htmlEl.style.height = '100dvh';
      if (mainEl) mainEl.style.zIndex = '9999';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
      htmlEl.style.overflow = '';
      htmlEl.style.height = '';
      if (mainEl) mainEl.style.zIndex = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      htmlEl.style.overflow = '';
      htmlEl.style.height = '';
      if (mainEl) mainEl.style.zIndex = '';
    };
  }, [mobileDurationOpen, mobileStartTimeOpen]);

  // Sync selectedDuration to Redux booking state
  useEffect(() => {
    if (mounted) {
      dispatch(setDuration(selectedDuration));
    }
  }, [selectedDuration, mounted, dispatch]);

  /**
   * Changing the date or the duration invalidates the chosen start time - a
   * 10:00 start for one hour says nothing about whether 10:00 is free for three.
   *
   * Deliberately separate from the fetch below, and deliberately not keyed on
   * `bookingId`. Taking a hold changes the booking id, and while those were one
   * effect that meant confirming a slot wiped the customer's own selection on the
   * way out - the picker snapped back to "choose a start time" just as it was
   * navigating to checkout, which read as the page refusing to move on.
   */
  useEffect(() => {
    if (!mounted || !calendarDay || !deviceTypeId) return;
    setSelectedStartTime(null);
    setAvailableStartTimes(new Set());
  }, [calendarDay, selectedDuration, mounted, deviceTypeId]);

  useEffect(() => {
    if (!mounted || !calendarDay || !deviceTypeId) {
      console.log('[Frontend] Skipping availability check:', { mounted, calendarDay: !!calendarDay, deviceTypeId: !!deviceTypeId });
      return;
    }

    checkAvailability();
    /**
     * Keyed on `hydrated`, never on `bookingId`.
     *
     * A hold restored after a refresh still has to be excluded from the grid, and
     * it arrives a tick after this first runs - but hydration is what delivers it,
     * so hydration is the thing to wait for.
     *
     * `bookingId` looks like the natural dependency and is a trap: taking a hold
     * changes it, so this effect fired as part of the same state update that
     * starts the navigation to checkout. `checkFlexibleAvailability` is a server
     * action, and Next applies a server action's revalidation to the route the
     * caller is still on - which cancelled the pending push. The navigation
     * silently did nothing perhaps two times in three, leaving the customer on the
     * picker with a hold already taken in their name, and their next attempt
     * refused because their own hold now occupied the station.
     */
  }, [calendarDay, selectedDuration, mounted, deviceTypeId, hydrated]);

  const checkAvailability = async () => {
    if (!calendarDay || !deviceTypeId) {
      console.log('[Frontend] Skipping availability check - missing date or deviceTypeId');
      return;
    }

    // Never query slots for a date outside the booking window
    if (!isDateWithinBookingWindow(calendarDay)) {
      console.log('[Frontend] Skipping availability check - date outside booking window');
      setAvailableStartTimes(new Set());
      return;
    }

    setQueryingDb(true);
    setAvailableStartTimes(new Set()); // Clear immediately when starting new check

    const dateStr = formatLocalDate(calendarDay);

    console.log(`[Frontend] ========================================`);
    console.log(`[Frontend] Checking availability for:`);
    console.log(`[Frontend] - Date: ${dateStr}`);
    console.log(`[Frontend] - Device Type: ${deviceTypeId}`);
    console.log(`[Frontend] - Duration: ${selectedDuration} minutes`);

    try {
      // A hold this browser already owns must not make its own slot look taken -
      // a customer who navigates back here still has ten minutes on it.
      const res = await checkFlexibleAvailability(dateStr, deviceTypeId, selectedDuration, bookingId);

      console.log(`[Frontend] Response received:`, {
        success: res.success,
        slotsCount: res.availableStartTimes?.length || 0,
        error: res.error
      });

      if (res.success && res.availableStartTimes) {
        const newAvailableSlots = new Set(res.availableStartTimes);
        setAvailableStartTimes(newAvailableSlots);
        console.log(`[Frontend] ✅ Set ${res.availableStartTimes.length} available slots for ${dateStr}`);
        console.log(`[Frontend] Sample available times:`, res.availableStartTimes.slice(0, 5));
      } else {
        setAvailableStartTimes(new Set());
        console.warn(`[Frontend] ❌ No available slots for ${dateStr}:`, res.error);
      }
    } catch (error) {
      console.error('[Frontend] ❌ Error checking availability:', error);
      setAvailableStartTimes(new Set());
    } finally {
      setQueryingDb(false);
      console.log(`[Frontend] ========================================\n`);
    }
  };

  const endTime = useMemo(() => {
    if (!selectedStartTime) return null;
    return calculateEndTime(selectedStartTime, selectedDuration);
  }, [selectedStartTime, selectedDuration]);

  /**
   * A late start with a long duration finishes tomorrow, and the end time alone
   * does not say so - "01:00 AM" reads as an hour of the chosen day that has
   * already gone. Everywhere this screen shows the end of the booking says which
   * day it lands on.
   */
  const endsNextDay = useMemo(
    () => (selectedStartTime ? crossesMidnight(selectedStartTime, selectedDuration) : false),
    [selectedStartTime, selectedDuration]
  );

  const endCalendarDay = useMemo(() => {
    if (!calendarDay || !selectedStartTime) return null;
    return bookingEndDate(calendarDay, selectedStartTime, selectedDuration);
  }, [calendarDay, selectedStartTime, selectedDuration]);

  const maxDurationForSelectedStartTime = useMemo(() => {
    if (!selectedStartTime) return 300;
    return getMaxDurationForStartTime(selectedStartTime);
  }, [selectedStartTime]);

  const filteredDurations = useMemo(() => {
    if (!selectedStartTime) return allDurations;
    return allDurations.filter(d => d.value <= maxDurationForSelectedStartTime);
  }, [allDurations, maxDurationForSelectedStartTime, selectedStartTime]);

  const additivesCostAggregated = useMemo(() => {
    return addons.reduce((sum, asset) => sum + (asset.price * asset.quantity), 0);
  }, [addons]);

  const extraPlayersCount = Math.max(0, playerCount - includedPlayers);
  const durationHours = selectedDuration / 60;
  // Same helpers the server prices with, so this screen cannot quote a number the
  // checkout then disagrees with.
  const extraPlayersTotal = extraPlayersCharge(extraPlayersCount, extraPlayerCharge, durationHours);
  const perPlayerCharge = perExtraPlayerCharge(extraPlayerCharge, durationHours);
  const baselineSubtotal = calculatePrice(hourlyRate || 0, selectedDuration);

  // Check for Happy Hour discount
  const happyHourInfo = useMemo(() => {
    if (!calendarDay || !selectedStartTime || !deviceTypeName) {
      return { rule: null, discount: 0, discountAmount: 0 };
    }

    const endTime = calculateEndTime(selectedStartTime, selectedDuration);
    const { rule, discount } = checkHappyHour(
      deviceTypeName,
      calendarDay,
      selectedStartTime,
      endTime
    );

    // Happy hour applies to device booking + extra players (NOT addons/food)
    const discountableAmount = baselineSubtotal + extraPlayersTotal;
    const discountAmount = rule ? calculateDiscount(discountableAmount, discount) : 0;

    return { rule, discount, discountAmount };
  }, [calendarDay, selectedStartTime, deviceTypeName, selectedDuration, baselineSubtotal, extraPlayersTotal, checkHappyHour, calculateDiscount]);

  const aggregatedPayableTotal = baselineSubtotal + extraPlayersTotal + additivesCostAggregated - happyHourInfo.discountAmount;

  const selectedDurationLabel = useMemo(() => {
    const duration = allDurations.find(d => d.value === selectedDuration);
    return duration?.label || "";
  }, [selectedDuration, allDurations]);

  // Clear selected start time if it's no longer available after date/duration change
  useEffect(() => {
    if (selectedStartTime && availableStartTimes.size > 0 && !availableStartTimes.has(selectedStartTime)) {
      console.log(`[Frontend] Selected time ${selectedStartTime} is no longer available, resetting`);
      setSelectedStartTime(null);
    }
  }, [availableStartTimes, selectedStartTime]);

  const handleRegisterTransactionLock = async () => {
    if (!calendarDay) {
      toast.error("Please select a date to proceed");
      return;
    }
    if (!isDateWithinBookingWindow(calendarDay)) {
      toast.error(BOOKING_WINDOW_ERROR);
      return;
    }
    if (!selectedStartTime) {
      toast.error("Please select a start time to proceed");
      return;
    }
    if (!deviceTypeId) {
      toast.error("Please select a device to proceed");
      return;
    }
    if (!isTimeAvailable(selectedStartTime)) {
      toast.error("Selected time slot is not available");
      return;
    }
    if (!endTime) {
      // Unreachable while a start time is set, but it narrows the type and would
      // otherwise be the one exit that told the customer nothing.
      toast.error("Please select a start time to proceed");
      return;
    }

    if (!isWithinBusinessHours(selectedStartTime, endTime)) {
      toast.error("Selected time range exceeds business hours");
      return;
    }

    setSubmittingLock(true);
    const dateQueryString = formatLocalDate(calendarDay);
    // The marker travels with the label, so every later screen that shows the
    // reserved slot - checkout, the success card, Retrieve Booking - says which
    // day it ends on without each having to work it out again.
    const slotLabel = `${selectedStartTime} - ${endTime}${endsNextDay ? " (next day)" : ""}`;

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
      durationMinutes: selectedDuration,
      playerCount,
      // Picking again gives the previous station back in the same round trip,
      // rather than leaving this customer sitting on two of them.
      previousHold: bookingId && holdToken ? { bookingId, holdToken } : null
    });

    if (res.success && res.bookingId && res.holdToken && res.expiresAt) {
      dispatch(setSlot({ date: dateQueryString, slot: slotLabel, startTime: selectedStartTime, endTime }));
      dispatch(setSlotHold({
        bookingId: res.bookingId,
        holdToken: res.holdToken,
        expiresAt: res.expiresAt
      }));
      dispatch(setPricing({
        subtotal: baselineSubtotal,
        subscriptionDiscount: 0,
        promoDiscount: 0,
        happyHourDiscount: happyHourInfo.discountAmount,
        total: aggregatedPayableTotal
      }));
      dispatch(setHappyHour({
        ruleId: happyHourInfo.rule?.id || null,
        ruleName: happyHourInfo.rule?.name || null,
        discount: happyHourInfo.discountAmount
      }));
      router.push("/booking/auth");
    } else {
      toast.error(res.error);
    }
    setSubmittingLock(false);
  };

  if (!mounted) return null;

  const isTimeAvailable = (time: string) => availableStartTimes.has(time);
  const canProceed = calendarDay && selectedStartTime && endTime && isTimeAvailable(selectedStartTime);

  // Check if a time slot qualifies for happy hour
  const checkSlotHasHappyHour = (startTime: string): { hasHappyHour: boolean; discount: number; ruleName: string | null } => {
    if (!calendarDay || !deviceTypeName) {
      return { hasHappyHour: false, discount: 0, ruleName: null };
    }

    const endTime = calculateEndTime(startTime, selectedDuration);
    const { rule, discount } = checkHappyHour(
      deviceTypeName,
      calendarDay,
      startTime,
      endTime
    );

    return {
      hasHappyHour: !!rule,
      discount: discount,
      ruleName: rule?.name || null
    };
  };

  return (
    <div className="max-w-md md:max-w-7xl mx-auto py-2 px-1 pb-28 md:pb-12">

      {/* Progress Steps */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pb-6 px-2 select-none">
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[11px] flex items-center justify-center">1</div>
          <span className="text-xs font-black uppercase text-primary tracking-wider">Time Slot</span>
        </div>
        <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-400 font-black text-[11px] flex items-center justify-center">2</div>
          <span className="text-xs font-black uppercase text-primary tracking-wider">Details</span>
        </div>

        <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-400 font-bold text-[11px] flex items-center justify-center border border-zinc-800">3</div>
          <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Payment</span>
        </div>
      </div>

      {/* Happy Hour Banner */}
      {happyHourInfo.rule && (
        <div className="max-w-md mx-auto mb-4 px-2">
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-yellow-200">{happyHourInfo.rule.name}</p>
              <p className="text-xs text-yellow-300/80">{happyHourInfo.discount}% discount on eligible slots!</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Device Info */}
          <div className="bg-[#111] border border-zinc-900 rounded-xl p-4 flex items-center justify-between gap-4 shadow-md glow-box-hover">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 text-primary rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-xs sm:text-sm min-w-0 text-white uppercase break-words leading-tight">{deviceTypeName || "Gaming Device"}</h4>
                <p className="text-zinc-400 text-xs font-bold mt-0.5"><span className="text-primary font-black">₹{hourlyRate || 0}</span> / hour</p>
              </div>
            </div>
            <Button variant="gradient" onClick={() => router.push("/booking")} className="text-black font-black text-xs uppercase h-7 px-3 flex-shrink-0">
              Change
            </Button>
          </div>

          {/* Info Banner */}
          <Card className="bg-gradient-to-r from-primary/5 via-amber-400/5 to-primary/5 border-primary/20 p-4 glow-box-hover">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">Flexible Booking</p>
                <p className="text-xs text-zinc-400">Book from 30 minutes to 5 hours. Choose your preferred start time and duration.</p>
              </div>
            </div>
          </Card>

          {/* Mobile Flow Container */}
          <div className="space-y-4 md:hidden">
            {/* Date Selection - today + next 6 days, all on one row */}
            <div className="space-y-2">
              <span className="text-label-enhanced block pl-1">Select Date</span>
              <DateSelector selected={calendarDay} onSelect={setCalendarDay} />
            </div>

            <div onClick={() => setMobileDurationOpen(true)} className="bg-[#111] border border-zinc-900 p-4 rounded-xl flex justify-between items-center cursor-pointer glow-box-hover">
              <div className="space-y-1">
                <span className="text-label-enhanced block">Duration</span>
                <span className="text-sm font-black text-white">{selectedDurationLabel}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>

            <div onClick={() => setMobileStartTimeOpen(true)} className="bg-[#111] border border-zinc-900 p-4 rounded-xl flex justify-between items-center cursor-pointer glow-box-hover">
              <div className="space-y-1">
                <span className="text-label-enhanced block">Start Time</span>
                <span className="text-sm font-black text-primary">{selectedStartTime || "Choose Start Time"}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>




            {/* Inline Dynamic Mobile Summary Card Block */}
            <Card className="bg-[#111] border border-zinc-900 p-5 space-y-4 shadow-xl rounded-xl glow-box-strong">
              <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider border-b border-zinc-900/60 pb-2">Booking Summary</h3>

              <div className="space-y-2.5 text-sm text-zinc-300 border-b border-zinc-900/60 pb-3">
                <div className="flex justify-between"><span>Date:</span><strong className="text-white font-bold">{calendarDay ? `${calendarDay.toLocaleDateString()} (${calendarDay.toLocaleDateString('en-US', { weekday: 'short' })})` : "Not Selected"}{endsNextDay && endCalendarDay && <span className="text-amber-400 font-bold block text-xs mt-0.5">ends {endCalendarDay.toLocaleDateString()} ({endCalendarDay.toLocaleDateString('en-US', { weekday: 'short' })})</span>}</strong></div>
                <div className="flex justify-between"><span>Duration:</span><strong className="text-white font-bold">{selectedDurationLabel}</strong></div>
                <div className="flex justify-between"><span>Start Time:</span><strong className="text-primary font-black">{selectedStartTime || "Not Selected"}</strong></div>
                <div className="flex justify-between"><span>End Time:</span><strong className="text-primary font-black">{endTime || "--"}{endsNextDay && <span className="text-amber-400 font-bold ml-1">(next day)</span>}</strong></div>
                <div className="flex justify-between"><span>Device:</span><strong className="text-xs text-white uppercase truncate max-w-[200px]">{deviceTypeName || "N/A"}</strong></div>
              </div>

              {/* Player Multiplier Controller */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Number of Players</h4>
                <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-2.5">
                  <p className="text-xs text-zinc-300 font-bold">{includedPlayers} included • Max {maxPlayers}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => playerCount > 1 && dispatch(setPlayerCount(playerCount - 1))}
                      disabled={playerCount <= 1}
                      className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-white disabled:opacity-30 flex items-center justify-center hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-base font-black text-white w-6 text-center">{playerCount}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (playerCount >= maxPlayers) {
                          toast.error(`Maximum ${maxPlayers} players only`);
                        } else {
                          dispatch(setPlayerCount(playerCount + 1));
                        }
                      }}
                      disabled={playerCount >= maxPlayers}
                      className="w-7 h-7 rounded-md bg-gradient-to-r from-primary to-amber-400 text-black flex items-center justify-center font-bold hover:shadow-[0_0_15px_rgba(255,193,7,0.5)] disabled:opacity-30 transition-all duration-300"
                    >
                      <Plus className="h-3 w-3 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Price Calculations */}
              <div className="space-y-2 text-sm text-zinc-300 pt-1">
                <div className="flex justify-between"><span>Base Rate ({selectedDurationLabel})</span><span className="text-white font-bold">₹{Math.round(baselineSubtotal)}.00</span></div>
                {extraPlayersCount > 0 && (
                  <div className="flex justify-between"><span>Extra Players ({extraPlayersCount} × ₹{perPlayerCharge})</span><span className="text-primary font-bold">₹{extraPlayersTotal}.00</span></div>
                )}
                {happyHourInfo.rule && happyHourInfo.discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      Happy Hour ({happyHourInfo.discount}% OFF)
                    </span>
                    <span className="text-green-400 font-bold">-₹{Math.round(happyHourInfo.discountAmount)}.00</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2.5 border-t border-zinc-900 text-white font-black">
                  <span className="text-sm uppercase">Total Payable</span>
                  <span className="text-xl text-primary">₹{Math.round(aggregatedPayableTotal)}.00</span>
                </div>
              </div>
            </Card>

            <div ref={confirmButtonRef} className="w-full">
              {!canProceed && (
                <p className="text-xs font-bold text-amber-500 text-center mt-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                  {!calendarDay
                    ? "⚠️ Please select a date to proceed"
                    : !selectedStartTime
                      ? "⚠️ Please select a start time to proceed"
                      : "⚠️ Selected time slot is not available"}
                </p>
              )}

              <Button variant="gradient" disabled={submittingLock} onClick={handleRegisterTransactionLock} className={`w-full text-black font-black uppercase text-xs py-5 rounded-xl flex items-center justify-center gap-1 mt-2 shadow-[0_4px_20px_rgba(255,193,7,0.2)] ${!canProceed ? "opacity-50 cursor-not-allowed" : ""}`}>
                {submittingLock ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm & Hold Slot <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Button>
            </div>

          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block space-y-6">
            {/* Date Selection - today + next 6 days */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">📅 Select Date</h3>
              <DateSelector selected={calendarDay} onSelect={setCalendarDay} />
            </div>

            <div className="grid grid-cols-2 gap-6 items-start">
            {/* Duration Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">⏱️ Duration</h3>
              <div className="space-y-1.5">
                {filteredDurations.map((duration) => {
                  const isSelected = selectedDuration === duration.value;
                  const price = calculatePrice(hourlyRate || 0, duration.value);
                  return (
                    <button
                      key={duration.value}
                      onClick={() => {
                        setSelectedDuration(duration.value);
                        dispatch(setDuration(duration.value))
                      }}
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
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">🕒 Start Time</h3>
              {queryingDb ? (
                <div className="h-96 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <p className="text-xs text-zinc-400">Checking availability...</p>
                </div>
              ) : availableStartTimesForDate.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center gap-2 text-center px-4">
                  <Clock className="h-8 w-8 text-zinc-700" />
                  <p className="text-sm text-zinc-400 font-bold">No time slots available</p>
                  <p className="text-xs text-zinc-400">Try selecting a different date or duration</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950">
                  {availableStartTimesForDate.map((time) => {
                    const isAvailable = isTimeAvailable(time);
                    const isSelected = selectedStartTime ? isTimeSlotWithinRange(time, selectedStartTime, selectedDuration) : false;
                    const happyHourCheck = checkSlotHasHappyHour(time);
                    return (
                      <button
                        key={time}
                        disabled={!isAvailable}
                        onClick={() => setSelectedStartTime(time)}
                        className={`w-full p-3 border text-left rounded-xl transition-all duration-300 text-sm font-bold relative ${!isAvailable
                          ? "bg-zinc-950/20 border-zinc-950 text-zinc-800 cursor-not-allowed"
                          : isSelected
                            ? "bg-gradient-to-r from-primary via-yellow-400 to-primary border-transparent text-black shadow-[0_4px_20px_rgba(255,193,7,0.4)]"
                            : happyHourCheck.hasHappyHour
                              ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 text-yellow-200 hover:border-yellow-500/50 hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-orange-500/20 hover:shadow-[0_0_15px_rgba(255,193,7,0.3)]"
                              : "bg-[#111] border-zinc-900 text-zinc-300 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-yellow-400/10 hover:shadow-[0_0_15px_rgba(255,193,7,0.2)]"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{time} - {calculateEndTime(time, 30)}</span>
                          {happyHourCheck.hasHappyHour && !isSelected && (
                            <span className="flex items-center gap-1 text-xs font-black text-yellow-400">
                              <Sparkles className="w-3 h-3" />
                              {happyHourCheck.discount}% OFF
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Summary */}
        <div className="hidden lg:block w-[360px] flex-shrink-0">
          <Card className="bg-[#111] border border-zinc-900 p-6 text-white space-y-6 shadow-2xl rounded-2xl sticky top-24 glow-box-strong">
            <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-3">Booking Summary</h3>

            <div className="space-y-4 text-sm text-zinc-300 border-b border-zinc-900 pb-3">
              <div className="flex justify-between">
                <span>Date:</span>
                <strong className="text-white font-bold">{calendarDay ? `${calendarDay.toLocaleDateString()} (${calendarDay.toLocaleDateString('en-US', { weekday: 'short' })})` : "Not Selected"}{endsNextDay && endCalendarDay && <span className="text-amber-400 font-bold block text-xs mt-0.5">ends {endCalendarDay.toLocaleDateString()} ({endCalendarDay.toLocaleDateString('en-US', { weekday: 'short' })})</span>}</strong>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <strong className="text-white font-bold">{selectedDurationLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span>Start Time:</span>
                <strong className="text-primary font-black">{selectedStartTime || "Not Selected"}</strong>
              </div>
              <div className="flex justify-between">
                <span>End Time:</span>
                <strong className="text-primary font-black">{endTime || "--"}{endsNextDay && <span className="text-amber-400 font-bold ml-1">(next day)</span>}</strong>
              </div>
              <div className="flex justify-between">
                <span>Device:</span>
                <strong className="text-xs text-white uppercase text-right max-w-[200px] break-words leading-tight max-w-[160px]">{deviceTypeName || "N/A"}</strong>
              </div>
            </div>

            {/* Player Selection Desktop */}
            <div className="border-b border-zinc-900 pb-4">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-3">Number of Players</h4>
              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-sm text-zinc-300 font-bold">
                    {includedPlayers} included • Max {maxPlayers}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playerCount > 1 && dispatch(setPlayerCount(playerCount - 1))}
                    disabled={playerCount <= 1}
                    className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 flex items-center justify-center"
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
                    className="w-7 h-7 rounded-md bg-gradient-to-r from-primary to-amber-400 border border-transparent text-black disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,193,7,0.5)] transition-all duration-300 flex items-center justify-center font-bold"
                  >
                    <Plus className="h-3 w-3 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm text-zinc-300">
              <div className="flex justify-between">
                <span>Base Rate ({selectedDurationLabel})</span>
                <span className="text-white font-bold">₹{Math.round(baselineSubtotal)}.00</span>
              </div>
              {extraPlayersCount > 0 && (
                <div className="flex justify-between">
                  <span>Extra Players ({extraPlayersCount} × ₹{perPlayerCharge})</span>
                  <span className="text-primary font-bold">₹{extraPlayersTotal}.00</span>
                </div>
              )}
              {happyHourInfo.rule && happyHourInfo.discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    Happy Hour ({happyHourInfo.discount}% OFF)
                  </span>
                  <span className="text-green-400 font-bold">-₹{Math.round(happyHourInfo.discountAmount)}.00</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-zinc-900 text-white font-black">
                <span className="text-xs uppercase">Total Payable</span>
                <span className="text-2xl text-primary">₹{Math.round(aggregatedPayableTotal)}.00</span>
              </div>
            </div>

            {!canProceed && (
              <p className="text-xs font-bold text-amber-500 text-center mt-3 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                {!calendarDay
                  ? "⚠️ Please select a date to proceed"
                  : !selectedStartTime
                    ? "⚠️ Please select a start time to proceed"
                    : "⚠️ Selected time slot is not available"}
              </p>
            )}

            <Button
              variant="gradient"
              disabled={submittingLock}
              onClick={handleRegisterTransactionLock}
              className={`w-full text-black font-black uppercase py-5 text-xs rounded-xl flex items-center justify-center gap-1 mt-3 ${!canProceed ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submittingLock ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & Hold Slot <ChevronRight className="h-4 w-4 stroke-[3]" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Mobile Drawers */}
      {mobileDurationOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:hidden">
          <div className="bg-[#121212] border-t border-zinc-800 rounded-t-2xl w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-xs font-black uppercase text-zinc-400">Select Duration</span>
              <button onClick={() => setMobileDurationOpen(false)} className="p-1.5 rounded-full bg-zinc-950 text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {filteredDurations.map((duration) => {
                const isSelected = selectedDuration === duration.value;
                const price = calculatePrice(hourlyRate || 0, duration.value);
                return (
                  <button
                    key={duration.value}
                    onClick={() => {
                      setSelectedDuration(duration.value);
                      setMobileDurationOpen(false);
                      dispatch(setDuration(duration.value))
                    }}
                    className={`w-full p-3 border text-left rounded-xl ${isSelected ? "bg-primary text-black border-transparent" : "bg-[#111] border-zinc-900 text-zinc-300"
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

      {mobileStartTimeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:hidden">
          <div className="bg-[#121212] border-t border-zinc-800 rounded-t-2xl w-full p-5 space-y-4 max-h-[75vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2 flex-shrink-0">
              <span className="text-xs font-black uppercase text-zinc-400">Select Start Time</span>
              <button onClick={() => setMobileStartTimeOpen(false)} className="p-1.5 rounded-full bg-zinc-950 text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Optimized High Contrast 2-Column Grid Layout for Mobile Time Windows */}
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 pb-4 scrollbar-thin">
              {availableStartTimesForDate.map((time) => {
                const isAvailable = isTimeAvailable(time);
                const isSelected = selectedStartTime ? isTimeSlotWithinRange(time, selectedStartTime, selectedDuration) : false;
                const happyHourCheck = checkSlotHasHappyHour(time);
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => {
                      setSelectedStartTime(time);
                      setMobileStartTimeOpen(false);
                      setTimeout(() => {
                        confirmButtonRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'end'
                        });
                      }, 300);
                    }}
                    className={`p-3 text-center rounded-xl text-xs font-black uppercase transition-all tracking-wider border relative ${!isAvailable
                      ? "bg-zinc-950/40 border-zinc-900/40 text-zinc-800 cursor-not-allowed line-through"
                      : isSelected
                        ? "bg-primary border-transparent text-black shadow-[0_0_15px_rgba(255,193,7,0.25)]"
                        : happyHourCheck.hasHappyHour
                          ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 text-yellow-200"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300 active:border-zinc-700"
                      }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span>{time} - {calculateEndTime(time, 30)}</span>
                      {happyHourCheck.hasHappyHour && !isSelected && (
                        <span className="flex items-center justify-center gap-0.5 text-[11px] font-black text-yellow-400">
                          <Sparkles className="w-2.5 h-2.5" />
                          {happyHourCheck.discount}% OFF
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}



    </div>
  );
}