"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { BreakpointLoader } from "@/components/shared/BreakpointLoader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateSelector } from "@/components/booking/DateSelector";
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
import { createWalkInBooking, createWalkInSession } from "../actions";
import {
  formatDateForDB,
  formatDateForDisplay,
  handleDobInput,
  isValidDob,
  DOB_ERROR,
  formatLocalDate,
  isDateWithinBookingWindow,
  BOOKING_WINDOW_ERROR
} from "@/lib/utils/dates";
import { allFilled, isPlausibleEmail } from "@/lib/utils/forms";
import {
  generateStartTimes,
  filterPastTimeSlots,
  generateDurationOptions,
  calculateEndTime,
  getMaxDurationForStartTime,
  calculatePrice,
  isTimeSlotWithinRange
} from "@/lib/utils/timeSlots";
import { useHappyHours } from "@/lib/hooks/useHappyHours";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { bookingNotificationId } from "@/lib/hooks/useAdminNotificationPolling";
import { extraPlayersCharge, perExtraPlayerCharge } from "@/lib/payments/money";

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

  /**
   * Two different things share this screen.
   *
   * "session" is the walk-in proper: somebody standing at the counter now, with
   * no start time and no duration, billed for however long they end up playing.
   * "advance" is a counter booking for a slot later in the week, which still
   * needs a date, a start and a duration because its price has to be known when
   * it is taken.
   */
  const [mode, setMode] = useState<"session" | "advance">("session");
  const [availableStartTimes, setAvailableStartTimes] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Player count
  const [playerCount, setPlayerCount] = useState(1);

  // Customer details flow states
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDob, setCustomerDob] = useState("");
  /** Set once Continue has been pressed, so empty required fields can speak up too. */
  const [showDetailErrors, setShowDetailErrors] = useState(false);
  const [showFullRegistrationFields, setShowFullRegistrationFields] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // Happy Hours
  const { checkHappyHour, calculateDiscount } = useHappyHours();

  const { addNotification } = useNotifications();

  const allStartTimes = useMemo(() => generateStartTimes(), []);
  const allDurations = useMemo(() => generateDurationOptions(), []);

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
    // Never query slots for a date outside the booking window
    if (!isDateWithinBookingWindow(selectedDate)) {
      setAvailableStartTimes(new Set());
      return;
    }
    setLoadingSlots(true);
    const dateString = formatLocalDate(selectedDate);

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
    // A walk-in has no slot to pick: the clock starts when the customer is
    // checked in, so the date and duration step is skipped entirely.
    setStep(mode === "session" ? 3 : 2);
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

      if (result.subscription) {
        setActiveSubscription(result.subscription);
        toast.success("Profile Authenticated", {
          description: `Welcome back, ${result.customer.name}! Active subscription: ${result.subscription.plan_name} (${result.subscription.discount_percentage}% off)`
        });
      } else {
        setActiveSubscription(null);
        toast.success("Profile Authenticated", { description: `Welcome back, ${result.customer.name}! Adjust players if required on final step.` });
      }
      setStep(4);
    } else {
      setActiveSubscription(null);
      toast.info("New Profile Detected", { description: "Please complete registration parameters below." });
      setShowFullRegistrationFields(true);
    }
    setCheckingProfile(false);
  };

  const handleManualRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    /**
     * A dead button explains nothing.
     *
     * This used to be gated by `disabled`, so an impossible date left staff
     * pressing a button that did nothing and no indication of which field was at
     * fault. It stays clickable; pressing it reveals the message under every
     * offending field and holds the step.
     */
    if (!customerDetailsComplete) {
      setShowDetailErrors(true);
      return;
    }

    setShowDetailErrors(false);
    setStep(4);
  };

  /**
   * Creates a walk-in that has not started yet.
   *
   * Nothing about the session is decided here - no time, no station, no price.
   * All of that follows from check-in and checkout, which is why this posts so
   * much less than the fixed-slot path below it.
   */
  const handleSubmitSession = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please fill in customer name and phone number");
      return;
    }
    if (customerDob && !isValidDob(customerDob)) {
      toast.error("Invalid Date of Birth", { description: DOB_ERROR });
      return;
    }

    setSubmitting(true);

    const result = await createWalkInSession({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || null,
      customerDob: customerDob ? formatDateForDB(customerDob) : "",
      deviceTypeId: selectedDeviceType.id,
      deviceTypeName: selectedDeviceType.display_name,
      playerCount
    });

    if (result.success) {
      toast.success("Walk-in created", {
        description: `${result.bookingNumber} is waiting for check-in. Check the customer in when they sit down.`
      });
      // This path announced nothing but a toast on the desk that typed it, so a
      // walk-in never reached the bell, never reached a second screen, and was
      // gone on reload. The id matches the poller's, so its own sweep of the same
      // booking lands on this entry rather than adding a second one.
      // A session is billed on actual time, so there is no total to quote yet.
      addNotification({
        id: bookingNotificationId(result.bookingId || ""),
        type: "booking",
        title: "New Walk-In Booking",
        message: `${customerName.trim()} • #${result.bookingNumber} • ${selectedDeviceType.display_name} • awaiting check-in`,
        bookingId: result.bookingId || "",
        bookingNumber: result.bookingNumber || ""
      });
      router.push("/admin/bookings");
    } else {
      toast.error("Could not create the walk-in", { description: result.error });
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === "session") return handleSubmitSession();

    if (!customerName.trim() || !customerPhone.trim() || !selectedStartTime || !endTime) {
      toast.error("Please fill in customer name, phone number, and choose a valid time slot");
      return;
    }

    if (!isDateWithinBookingWindow(selectedDate)) {
      toast.error(BOOKING_WINDOW_ERROR);
      return;
    }

    setSubmitting(true);

    const extraPlayersCount = Math.max(0, playerCount - (selectedDeviceType?.included_players || 1));
    const durationHours = selectedDuration / 60;
    const extraPlayerCharge = extraPlayersCharge(extraPlayersCount, Number(selectedDeviceType?.extra_player_charge) || 0, durationHours);
    const baseRate = calculatePrice(Number(selectedDeviceType?.regular_hourly_rate) || 0, selectedDuration);
    const subtotal = baseRate + extraPlayerCharge;
    const subscriptionDiscount = activeSubscription
      ? (subtotal * activeSubscription.discount_percentage) / 100
      : 0;

    // Calculate happy hour discount
    const endTimeCalc = calculateEndTime(selectedStartTime, selectedDuration);
    const { rule: happyHourRule, discount: happyHourDiscount } = checkHappyHour(
      selectedDeviceType.display_name,
      selectedDate,
      selectedStartTime,
      endTimeCalc
    );
    const happyHourDiscountAmount = happyHourRule ? calculateDiscount(subtotal, happyHourDiscount) : 0;

    const total = subtotal - subscriptionDiscount - happyHourDiscountAmount;

    // Validate DOB
    // isValidDob covers both the DD-MM-YYYY shape and the accepted year range.
    if (!isValidDob(customerDob)) {
      toast.error(DOB_ERROR);
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
      selectedDate: formatLocalDate(selectedDate),
      selectedSlot: `${selectedStartTime} - ${endTime}`,
      slotStartTime: selectedStartTime,
      slotEndTime: endTime,
      durationHours,
      hourlyRate: Number(selectedDeviceType.regular_hourly_rate) || 0,
      playerCount,
      includedPlayers: selectedDeviceType.included_players,
      extraPlayerCharge: Number(selectedDeviceType.extra_player_charge),
      subtotal: baseRate,
      total,
      subscriptionDiscount,
      happyHourDiscount: happyHourDiscountAmount,
      happyHourRuleId: happyHourRule?.id || null
    });

    setSubmitting(false);

    if (result.success) {
      // One notification for the confirmed booking: it toasts, chimes and lands
      // in the bell. The poller skips walk-ins so this is not repeated.
      // An advance booking is always for later, so it waits for check-in like any
      // other reservation - there is no "already checked in" case here.
      addNotification({
        id: bookingNotificationId(result.bookingId || ""),
        type: "booking",
        title: "Advance Booking Confirmed",
        message: `${customerName.trim()} • #${result.bookingNumber} • ₹${Math.round(total).toLocaleString("en-IN")}`,
        bookingId: result.bookingId || "",
        bookingNumber: result.bookingNumber || ""
      });
      router.push("/admin/bookings");
    } else {
      toast.error("Failed to create booking", { description: result.error });
    }
  };

  const extraPlayersCount = Math.max(0, playerCount - (selectedDeviceType?.included_players || 1));
  const durationHours = selectedDuration / 60;
  const extraPlayerCharge = extraPlayersCharge(extraPlayersCount, Number(selectedDeviceType?.extra_player_charge) || 0, durationHours);
  const baseRate = calculatePrice(Number(selectedDeviceType?.regular_hourly_rate) || 0, selectedDuration);
  const subtotal = baseRate + extraPlayerCharge;
  const subscriptionDiscount = activeSubscription
    ? (subtotal * activeSubscription.discount_percentage) / 100
    : 0;

  // Calculate Happy Hour discount
  const happyHourInfo = useMemo(() => {
    if (!selectedDate || !selectedStartTime || !selectedDeviceType?.display_name) {
      return { rule: null, discount: 0, discountAmount: 0 };
    }

    const endTime = calculateEndTime(selectedStartTime, selectedDuration);
    const { rule, discount } = checkHappyHour(
      selectedDeviceType.display_name,
      selectedDate,
      selectedStartTime,
      endTime
    );

    // Happy hour applies to device booking + extra players (same as customer flow)
    const discountableAmount = subtotal;
    const discountAmount = rule ? calculateDiscount(discountableAmount, discount) : 0;

    return { rule, discount, discountAmount };
  }, [selectedDate, selectedStartTime, selectedDeviceType, selectedDuration, subtotal, checkHappyHour, calculateDiscount]);

  // Memoize happy hour check for time slots
  const checkSlotHasHappyHour = useMemo(() => {
    return (time: string) => {
      if (!selectedDeviceType?.display_name || !selectedDate) {
        return { hasHappyHour: false, discount: 0 };
      }
      const slotEndTime = calculateEndTime(time, selectedDuration);
      const { rule, discount } = checkHappyHour(
        selectedDeviceType.display_name,
        selectedDate,
        time,
        slotEndTime
      );
      return { hasHappyHour: rule !== null, discount };
    };
  }, [selectedDeviceType, selectedDate, selectedDuration, checkHappyHour]);

  const totalAmount = subtotal - subscriptionDiscount - happyHourInfo.discountAmount;

  /**
   * Field-level problems, shown under the input that caused them.
   *
   * These used to be discovered only on the final submit, two screens later: the
   * gate below accepted any ten characters, so "31-02-2000" passed, the summary
   * opened, and the booking was refused at the last step with a toast the staff
   * member then had to walk back from. A date is checked where it is typed.
   *
   * Each message waits until the field has enough in it to be judged, so nothing
   * turns red while somebody is still part-way through typing.
   */
  /**
   * The problem with the date, if there is one.
   *
   * Says nothing while the date is still being typed - only once it is complete,
   * or once Continue has been pressed - so the field does not go red at the first
   * digit. `DOB_ERROR` is the one place the wording lives.
   */
  const describeDobProblem = (value: string): string | null => {
    if (!value.trim()) return "Date of birth is required.";
    if (value.length < 10 && !showDetailErrors) return null;
    return isValidDob(value) ? null : DOB_ERROR;
  };

  // Shown as soon as the field has something in it, or once Continue is pressed.
  const dobError =
    customerDob.trim() || showDetailErrors ? describeDobProblem(customerDob) : null;

  const emailError =
    (customerEmail.trim().length > 0 || showDetailErrors) && !isPlausibleEmail(customerEmail)
      ? customerEmail.trim()
        ? "Enter a complete email address, like customer@domain.com."
        : "Email is required."
      : null;

  const nameError =
    showDetailErrors && !customerName.trim() ? "Customer name is required." : null;

  /**
   * Whether every required field has something in it.
   *
   * This is what greys the button out: with a field still blank there is nothing
   * to correct and no message to show, so a disabled button is honest. Presence
   * only - a filled-in but impossible date leaves the button live, because that
   * is a mistake the form has to be able to tell staff about, and a dead button
   * cannot.
   */
  const requiredDetailsFilled = Boolean(
    customerName.trim() && customerDob.trim() && customerEmail.trim()
  );

  /**
   * Whether the mobile number is a complete one.
   *
   * The input strips anything that is not a digit and stops at ten, so a short
   * value is a half-typed number rather than a wrong one - there is nothing to
   * explain, and the placeholder already asks for ten digits. Matches the gate the
   * food walk-in screen already had on the same button.
   */
  const phoneComplete = customerPhone.trim().length === 10;

  // Whether the step may actually advance: filled *and* valid.
  const customerDetailsComplete =
    allFilled(customerName, customerDob) &&
    isValidDob(customerDob) &&
    isPlausibleEmail(customerEmail);

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
                } else if (step === 3 && mode === "session") {
                  setStep(1); // There is no slot step in a walk-in session.
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
              {mode === "session" ? "New Walk-In" : "Advance Counter Booking"}
            </h1>
          </div>
        </div>

        {/* What kind of booking this is. Only offered on the first step: once a
            device is chosen the two flows diverge, and switching underneath would
            leave half-entered times behind. */}
        {step === 1 && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                {
                  value: "session" as const,
                  title: "Walk-in now",
                  detail: "No times chosen. The customer is checked in when they arrive and billed for the time they actually play."
                },
                {
                  value: "advance" as const,
                  title: "Advance booking",
                  detail: "A fixed slot later today or this week. Date, start time and duration are chosen now, and the price is known up front."
                }
              ]).map((option) => {
                const isSelected = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected
                      ? "border-primary bg-primary/5"
                      : "border-zinc-900 bg-[var(--surface)] hover:border-zinc-700"
                      }`}
                  >
                    <p className={`text-sm font-black uppercase tracking-wide ${isSelected ? "text-primary" : "text-white"}`}>
                      {option.title}
                    </p>
                    <p className="text-xs text-muted-content mt-1 leading-relaxed">{option.detail}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Steps HUD Track */}
        <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto select-none">
          {(mode === "session"
            ? [
                { num: 1, label: "Device" },
                { num: 3, label: "Customer" },
                { num: 4, label: "Confirm" }
              ]
            : [
                { num: 1, label: "Device" },
                { num: 2, label: "Slot" },
                { num: 3, label: "Customer" },
                { num: 4, label: "Confirm" }
              ]
          ).map((s, idx, steps) => (
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
                <span className={`text-[11px] font-black uppercase tracking-wider ${step >= s.num ? "text-primary" : "text-muted-content"
                  }`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
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

            {/* Date Selection - today + next 6 days */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-secondary-content uppercase tracking-widest pl-1">📅 Select Date</h3>
              <DateSelector selected={selectedDate} onSelect={setSelectedDate} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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

                      // Check if this slot has happy hour
                      const happyHourCheck = checkSlotHasHappyHour(time);

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
                          <div className="flex items-center justify-between">
                            <span>{time} - {calculateEndTime(time, 30)}</span>
                            {happyHourCheck.hasHappyHour && !isSelected && (
                              <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-400/30 font-black">
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

            <div ref={proceedButtonRef} className="flex flex-col items-end mt-8 gap-2">
              {!selectedStartTime && (
                <p className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl max-w-sm text-right">
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
        {step === 3 && selectedDeviceType && (mode === "session" || selectedStartTime) && (
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
                    <Label htmlFor="phone" className="text-xs font-black text-muted-content uppercase tracking-wider flex items-center gap-1.5">
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

                  <Button type="submit" disabled={checkingProfile || !phoneComplete} className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-xl disabled:opacity-50 disabled:pointer-events-none">
                    {checkingProfile ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "VERIFY CUSTOMER PROFILE"} <ChevronRight className="h-4 w-4 stroke-[3]" />
                  </Button>
                </form>

                <div className="pt-2 flex gap-2 items-center text-xs text-muted-content justify-center border-t border-zinc-950">
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
                    <span className="text-[11px] font-black text-muted-content uppercase tracking-widest block">Customer Phone Number:</span>
                    <span className="text-primary font-mono font-black tracking-wider">+91 {customerPhone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFullRegistrationFields(false);
                      setActiveSubscription(null);
                    }}
                    className="px-3 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-black uppercase text-muted-content hover:text-primary rounded-lg tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Change Number
                  </button>
                </div>

                {/* noValidate so these messages are the only ones staff see - the
                    browser's own bubbles would fire first on the required fields
                    and say less. */}
                <form onSubmit={handleManualRegistrationSubmit} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black text-muted-content uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-content" /> Customer Name *
                    </Label>
                    <Input
                      id="name"
                      required
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer's full name"
                      aria-invalid={!!nameError}
                      aria-describedby={nameError ? "name-error" : undefined}
                      className={`bg-[var(--background)] h-12 text-sm text-white focus-visible:ring-primary rounded-xl ${nameError ? "border-red-500/70" : "border-zinc-900"}`}
                    />
                    {nameError && (
                      <p id="name-error" className="text-xs font-bold text-red-400">{nameError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-xs font-black text-muted-content uppercase tracking-wider flex items-center gap-1.5">
                      <Cake className="h-3.5 w-3.5 text-muted-content" /> Date of Birth (DD-MM-YYYY) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dob"
                      type="text"
                      placeholder="DD-MM-YYYY"
                      required
                      maxLength={10}
                      value={customerDob}
                      onChange={handleDobChange}
                      aria-invalid={!!dobError}
                      aria-describedby={dobError ? "dob-error" : undefined}
                      className={`bg-[var(--background)] h-12 text-sm text-white font-mono tracking-wider focus-visible:ring-primary rounded-xl placeholder:text-zinc-700 ${dobError ? "border-red-500/70" : "border-zinc-900"}`}
                    />
                    {dobError && (
                      <p id="dob-error" className="text-xs font-bold text-red-400">{dobError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black text-muted-content uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-content" /> Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@domain.com"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "email-error" : undefined}
                      className={`bg-[var(--background)] h-12 text-sm text-white focus-visible:ring-primary rounded-xl ${emailError ? "border-red-500/70" : "border-zinc-900"}`}
                    />
                    {emailError && (
                      <p id="email-error" className="text-xs font-bold text-red-400">{emailError}</p>
                    )}
                  </div>

                  <div className="pt-4 space-y-2">
                    {/* Disabled only while something is still blank. Once every
                        field has content the button goes live, so pressing it can
                        report what is actually wrong with it. */}
                    <Button type="submit" disabled={!requiredDetailsFilled} className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1 shadow-lg disabled:opacity-50 disabled:pointer-events-none">
                      PROCEED TO ORDER SUMMARY <ChevronRight className="h-4 w-4 stroke-[3]" />
                    </Button>
                  </div>
                </form>
              </Card>
            )}

          </div>
        )}

        {/* Step 4: Confirmation Summary Panel */}
        {step === 4 && selectedDeviceType && (mode === "session" || selectedStartTime) && (
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
                {mode === "advance" && (
                  <>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                      <span className="text-secondary-content">Target Date:</span>
                      <span className="text-white font-bold">{selectedDate.toDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                      <span className="text-secondary-content">Selected Time Window:</span>
                      <span className="text-primary font-bold">{selectedStartTime} - {endTime} ({selectedDurationLabel})</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-b border-zinc-900/60 pb-2">
                  <span className="text-secondary-content">Booking Type:</span>
                  <span className="text-white font-bold uppercase">
                    {mode === "session" ? "Walk-in — billed on actual play" : "Fixed slot"}
                  </span>
                </div>
              </div>

              {/* What creating this booking does, and just as importantly what it
                  does not do. Staff have to know the customer is not on a machine
                  yet and that no station is being held for them. */}
              {mode === "session" && (
                <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                      Waiting for check-in
                    </p>
                  </div>
                  <ul className="text-xs text-blue-200/80 space-y-1 leading-relaxed list-disc pl-4">
                    <li>The clock starts at <span className="font-bold">check-in</span>, not now.</li>
                    <li>A station is assigned when the customer checks in, so this booking does not reserve one.</li>
                    <li>The bill is calculated at checkout from the time actually played.</li>
                  </ul>
                </div>
              )}

              {/* Active Subscription Banner (if any) */}
              {activeSubscription && (
                <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 p-4 border border-primary/30 rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-primary uppercase tracking-wider">{activeSubscription.plan_name} Active</h4>
                      <p className="text-xs text-zinc-400">Customer gets {activeSubscription.discount_percentage}% off on this booking!</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-[var(--background)]/40 p-4 border border-zinc-900 rounded-xl space-y-3">
                <Label className="text-xs font-black uppercase text-muted-content tracking-wider block">
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

              {/* A session has no price until it is played, so there is nothing
                  to break down here. */}
              {mode === "advance" && (
              <div className="space-y-2 text-sm border-t border-zinc-900 pt-4 bg-[var(--background)]/20 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-secondary-content">Base Station Rate:</span>
                  <span className="text-white font-bold">₹{baseRate}.00</span>
                </div>
                {extraPlayersCount > 0 && (
                  <div className="flex justify-between animate-in slide-in-from-top-2 duration-150">
                    <span className="text-secondary-content">Extra Player Charge Layer ({extraPlayersCount} × ₹{perExtraPlayerCharge(Number(selectedDeviceType?.extra_player_charge) || 0, durationHours)}):</span>
                    <span className="text-primary font-bold">₹{extraPlayerCharge}.00</span>
                  </div>
                )}
                {subscriptionDiscount > 0 && (
                  <div className="flex justify-between text-green-500 animate-in slide-in-from-top-2 duration-150">
                    <span className="flex items-center gap-1">
                      Subscription Discount ({activeSubscription.discount_percentage}%):
                    </span>
                    <span className="font-bold">-₹{Math.round(subscriptionDiscount)}.00</span>
                  </div>
                )}
                {happyHourInfo.rule && happyHourInfo.discountAmount > 0 && (
                  <div className="flex justify-between text-yellow-400 animate-in slide-in-from-top-2 duration-150">
                    <span className="flex items-center gap-1">
                      Happy Hour ({happyHourInfo.discount}% OFF):
                    </span>
                    <span className="font-bold">-₹{Math.round(happyHourInfo.discountAmount)}.00</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-zinc-900 font-black text-lg">
                  <span className="text-white uppercase text-xs tracking-wider">Gross Total Amount:</span>
                  <span className="text-primary text-2xl font-mono">₹{Math.round(totalAmount)}.00</span>
                </div>
              </div>
              )}

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
