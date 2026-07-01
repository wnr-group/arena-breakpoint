"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  clearCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity
}
  from "@/lib/redux/slices/foodCartSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addFoodOrderToBooking,
  createStandaloneFoodOrder,
  validateMenuItems
} from "../actions";
import { checkCustomerExists } from "../../booking/actions";
import { validatePromoCode, calculatePromoDiscount } from "../../booking/promo-actions";
import {
  Loader2,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  User,
  Phone,
  Mail,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Cake,
  CheckCircle2, ArrowLeft, Tag
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { formatDateForDB, formatDateForDisplay, handleDobInput, isValidDateDDMMYYYY } from "@/lib/utils/dates";
import Link from "next/link";

type Step = "cart" | "phone" | "details" | "success";

export default function FoodCheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector((state) => state.foodCart.items);

  const bookingContext = useAppSelector((state) => ({
    bookingId: state.foodCart.bookingId,
    bookingNumber: state.foodCart.bookingNumber,
    customerPhone: state.foodCart.customerPhone,
    customerName: state.foodCart.customerName,
    customerDob: state.foodCart.customerDob,
  }));

  const [step, setStep] = useState<Step>("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState(bookingContext.customerPhone || "");
  const [name, setName] = useState(bookingContext.customerName || "");
  const [email, setEmail] = useState("");
  const [customerDob, setCustomerDob] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [mounted, setMounted] = useState(false);

  // Promo Code States
  const [promoCode, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (bookingContext.customerPhone) setPhone(bookingContext.customerPhone);
    if (bookingContext.customerName) setName(bookingContext.customerName);
    if (bookingContext.customerDob) setCustomerDob(bookingContext.customerDob);
  }, [bookingContext.customerPhone, bookingContext.customerName]);


  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = handleDobInput(e.target.value);
    setCustomerDob(formatted);
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const finalTotalAmount = useMemo(() => {
    return Math.max(0, cartTotal - promoDiscount);
  }, [cartTotal, promoDiscount]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsApplyingPromo(true);
    const result = await validatePromoCode(promoCode);

    if (result.success && result.promo) {
      const discount = await calculatePromoDiscount(
        cartTotal,
        result.promo.discount_type,
        result.promo.discount_value
      );

      setPromoDiscount(discount);
      setAppliedPromoCode(result.promo.code);
      toast.success("Promo code applied!", {
        description: `You saved ₹${discount.toFixed(2)} with code ${result.promo.code}`
      });
    } else {
      toast.error(result.error || "Invalid promo code");
    }
    setIsApplyingPromo(false);
  };

  const handleRemovePromo = () => {
    setPromoDiscount(0);
    setAppliedPromoCode(null);
    setPromoCodeInput("");
    toast.info("Promo code removed");
  };

  const handleProceedToCheckout = () => {
    if (bookingContext.bookingId) {
      // Get DOB from booking context or current form
      const dobValue = bookingContext.customerDob || customerDob;
      const formattedDob = dobValue ? formatDateForDB(dobValue) : "";

      submitOrderPayload(
        bookingContext.customerPhone || phone,
        bookingContext.customerName || name,
        null,
        formattedDob
      );
    } else {
      setStep("phone");
    }
  };

  const handlePhoneLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim() || phone.length < 10) {
      toast.error("Invalid Entry", { description: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setIsSubmitting(true);
    const result = await checkCustomerExists(phone);

    if (result.exists && result.customer) {
      setName(result.customer.name);
      setEmail(result.customer.email || "");
      // Handle DOB safely - convert from DB format if exists
      const dobFromDB = result.customer.date_of_birth;
      if (dobFromDB) {
        setCustomerDob(formatDateForDisplay(dobFromDB));
      }
      toast.success("Welcome back!", { description: `Hey ${result.customer.name}! Profile authenticated successfully.` });

      await submitOrderPayload(phone, result.customer.name, result.customer.email || null, dobFromDB || "");
    } else {
      toast.info("New Profile", { description: "Please complete registration to place your order." });
      setStep("details");
    }
    setIsSubmitting(false);
  };

  const handleNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Required Field Missing", { description: "Name configuration is necessary." });
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

    await submitOrderPayload(phone, name, email.trim() || null, formattedDob);
  };

  const submitOrderPayload = async (targetPhone: string, targetName: string, targetEmail: string | null, dob: string) => {
    setIsSubmitting(true);

    const validationResult = await validateMenuItems(
      cartItems.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }))
    );

    if (!validationResult.success) {
      toast.error("Inventory Discrepancy", { description: validationResult.error });
      setIsSubmitting(false);
      return;
    }

    let result;
    if (bookingContext.bookingId) {
      result = await addFoodOrderToBooking(
        bookingContext.bookingId,
        cartItems.map((item) => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        }))
      );
    } else {
      result = await createStandaloneFoodOrder(
        targetPhone,
        targetName,
        targetEmail,
        dob,
        cartItems.map((item) => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        })),
        appliedPromoCode,
        promoDiscount
      );
    }

    if (result.success) {
      if ('bookingNumber' in result && result.bookingNumber) {
        setOrderNumber(result.bookingNumber);
      } else if (bookingContext.bookingNumber) {
        setOrderNumber(bookingContext.bookingNumber);
      }
      toast.success("Order Placed Successfully!");
      setStep("success");
    } else {
      toast.error("Order Failed", { description: result.error });
    }
    setIsSubmitting(false);
  };

  const handleNewOrder = () => {
    dispatch(clearCart());
    router.push("/food");
  };

  if (!mounted) return null;

  if (cartItems.length === 0 && step !== "success") {
    return (
      <div className="h-[60vh] flex items-center justify-center bg-[#0d0a14]">
        <Card className="bg-[#111] border-zinc-900 p-12 max-w-md mx-auto rounded-xl glow-box-hover">
          <div className="text-center space-y-4">
            <ShoppingCart className="h-16 w-16 text-zinc-700 mx-auto" />
            <h2 className="text-xl font-black text-zinc-400 uppercase">Cart is Empty</h2>
            <p className="text-sm text-zinc-600">Add items to your cart to place an order</p>
            <Button variant="gradient" onClick={() => router.push("/food")} className="text-black font-black uppercase px-6 py-4 rounded-xl">
              Browse Menu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "cart") {
    return (
      <div className="w-full max-w-5xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col gap-1 select-none">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 mt-9 relative z-0">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="h-2.5 w-2.5 text-zinc-700" />

            <Link href="/food" className="hover:text-primary transition-colors">
              Respawn Refuel
            </Link>
            <ChevronRight className="h-2.5 w-2.5 text-zinc-700" />

            <span className="text-primary">Cart</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight mt-2">
            Your Cart <span className="text-zinc-500 font-medium text-lg lowercase font-sans">Items ({cartItemCount})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3.5">
            {cartItems.map((item) => (
              <Card
                key={item.menu_item_id}
                className="bg-[#121214] border border-zinc-900 p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all hover:border-zinc-800"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-900/60 flex-shrink-0">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-[12px] text-zinc-100 leading-tight line-clamp-2 break-words">
                      {item.name}
                    </h3>
                    <p className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest">{item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg">
                    <button type="button" onClick={() => dispatch(decrementQuantity(item.menu_item_id))} className="h-6 w-6 flex items-center justify-center text-zinc-500"><Minus className="h-3 w-3" /></button>
                    <span className="text-[10px] font-black text-zinc-200 w-5 text-center font-mono">{item.quantity}</span>
                    <button type="button" onClick={() => dispatch(incrementQuantity(item.menu_item_id))} className="h-6 w-6 flex items-center justify-center text-black bg-primary rounded"><Plus className="h-3 w-3" /></button>
                  </div>

                  <span className="text-[13px] font-mono font-black text-primary w-[40px] text-right">₹{item.price * item.quantity}</span>

                  <button type="button" onClick={() => dispatch(removeFromCart(item.menu_item_id))} className="text-zinc-600 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}

            <button type="button" onClick={() => router.push("/food")} className="flex items-center gap-2 text-xs font-black uppercase text-zinc-300 hover:text-primary pt-2 select-none tracking-wider transition-colors">
              ← Continue Shopping
            </button>
          </div>

          <div className="lg:col-span-5">
            <Card className="bg-[#121214] border border-zinc-900 p-6 space-y-5 rounded-2xl shadow-2xl glow-box-strong">
              <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wider pb-2 border-b border-zinc-900/60">Order Summary</h3>
              <div className="space-y-3.5 text-xs text-zinc-400">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-zinc-200 font-mono font-bold">₹{cartTotal}</span></div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-primary font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Promo Discount ({appliedPromoCode}):
                    </span>
                    <span className="font-mono">-₹{promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline font-black text-white pt-4 border-t border-t-zinc-900">
                  <span className="text-xs uppercase text-zinc-400 font-black">Total</span>
                  <span className="text-2xl text-primary font-mono tracking-tight">₹{finalTotalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Promo Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="bg-zinc-950 border-zinc-900 h-10 text-xs text-white rounded-xl uppercase font-mono"
                    disabled={isApplyingPromo || appliedPromoCode !== null}
                  />
                  {appliedPromoCode ? (
                    <Button
                      onClick={handleRemovePromo}
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-950/20 text-[10px] font-black uppercase h-10 px-4 rounded-xl"
                      disabled={isApplyingPromo}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || isApplyingPromo}
                      variant="gradient"
                      className="uppercase text-[10px] h-10 px-6 rounded-xl"
                    >
                      {isApplyingPromo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                    </Button>
                  )}
                </div>
                {appliedPromoCode && (
                  <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-950/30 px-3 py-2 rounded-lg border border-green-500/20 mt-2">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="font-bold">Code "{appliedPromoCode}" applied successfully!</span>
                  </div>
                )}
              </div>

              <Button variant="gradient" onClick={handleProceedToCheckout} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl shadow-xl shadow-primary/5 tracking-wider active:scale-[0.99] transition-transform">
                Proceed to Checkout
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (step === "phone") {
    return (
      <div className="w-full max-w-xl mx-auto py-8 px-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="w-full max-w-xs mx-auto flex items-center justify-between pb-8 select-none">
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-[9px] flex items-center justify-center">1</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Cart</span></div>
          <div className="h-0.5 bg-primary flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">2</div><span className="text-[8px] font-black uppercase text-primary tracking-wider">Details</span></div>
          <div className="h-0.5 bg-zinc-800 flex-1 mx-2" />
          <div className="flex flex-col items-center gap-1"><div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-500 font-bold text-[9px] flex items-center justify-center border border-zinc-800">3</div><span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Confirm</span></div>
        </div>

        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6 glow-box-hover">
          <div className="border-b border-zinc-900 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep("cart")}
                className="h-8 flex items-center gap-2 text-zinc-500 hover:text-white px-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-wider">Back to Cart</span>
              </Button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase text-white tracking-tight">CUSTOMER IDENTIFICATION</h3>
              <p className="text-xs text-zinc-500 font-medium">Enter your mobile number to load profiles or route standalone orders.</p>
            </div>
          </div>

          <form onSubmit={handlePhoneLookupSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Phone className="h-3 w-3 text-zinc-600" /> MOBILE NUMBER <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 border-r border-zinc-900 pr-2">+91</span>
                <Input
                  id="phone"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="bg-zinc-950 border-zinc-900 h-12 pl-12 text-sm text-white focus-visible:ring-primary font-mono tracking-wide rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button variant="gradient" type="submit" disabled={isSubmitting} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-xl transition-all">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "CONTINUE"} <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Button>
            </div>
          </form>

          <div className="pt-2 flex gap-2 items-center text-[10px] text-zinc-600 justify-center select-none border-t border-zinc-950">
            <ShieldCheck className="h-4 w-4 text-zinc-700" /><span>Your account is tracked safely inside active operational clusters.</span>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="w-full max-w-xl mx-auto py-4 px-2 animate-in fade-in duration-300">
        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6 glow-box-hover">
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">NEW CUSTOMER REGISTRATION</h3>
            <p className="text-xs text-zinc-500 font-medium">Please provide your credentials to map this checkout profile transaction.</p>
          </div>

          <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl flex items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Entered Identity</span>
              <span className="text-primary font-mono font-black tracking-wider">+91 {phone}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="px-3 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-black uppercase text-zinc-400 hover:text-primary rounded-lg tracking-wider flex items-center gap-1.5 transition-colors select-none"
            >
              <RefreshCw className="h-3 w-3" /> Change Number
            </button>
          </div>

          <form onSubmit={handleNewCustomerSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><User className="h-3 w-3 text-zinc-600" /> FULL NAME <span className="text-red-500">*</span></Label>
              <Input id="name" type="text" required placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary rounded-xl" />
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
                className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Mail className="h-3 w-3 text-zinc-600" /> EMAIL ADDRESS</Label>
              <Input id="email" type="email" placeholder="Enter your email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary rounded-xl" />
            </div>

            <div className="pt-4 space-y-2">
              <Button variant="gradient" type="submit" disabled={isSubmitting} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "PLACE FOOD ORDER"} <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300 flex flex-col items-center">


        <div className="text-center space-y-3 select-none">
          <div className="flex justify-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            Order Confirmed!
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Your food is being prepared.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch max-w-3xl">

          <Card className="bg-[#111113] border border-zinc-900 p-6 md:col-span-2 flex flex-col justify-between min-h-[220px] relative overflow-hidden rounded-xl shadow-2xl glow-box-strong">
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start w-full">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Order ID</span>
                  <span className="text-base font-black text-white font-mono tracking-wide">#{orderNumber || "FO-12345"}</span>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Status</span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" /> PAID
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-900/60 w-full text-xs">
                <div className="flex justify-between text-zinc-500 font-bold">
                  <span>Basket Items Count</span>
                  <span className="text-zinc-300 font-mono">{cartItemCount} items</span>
                </div>
                <div className="flex justify-between text-zinc-500 font-medium">
                  <span>Base Subtotal</span>
                  <span className="text-zinc-300 font-mono">₹{cartTotal}.00</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-primary font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Promo Discount ({appliedPromoCode}):
                    </span>
                    <span className="font-mono">-₹{promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline font-black text-white pt-2.5 border-t border-zinc-900/40 text-sm">
                  <span className="text-[10px] uppercase text-zinc-400 font-black tracking-wider">Amount Paid</span>
                  <span className="text-base text-primary font-mono tracking-tight">₹{finalTotalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-[#111113] border border-zinc-900 p-5 flex flex-col items-center justify-center text-center space-y-4 rounded-xl shadow-2xl group/qr glow-box-hover">
            <div className="p-2 bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-primary rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,193,7,0.1)] w-36 h-36 relative overflow-hidden group-hover/qr:shadow-[0_0_25px_rgba(255,193,7,0.2)] transition-all duration-300">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,193,7,0.08)_0%,transparent_70%)] pointer-events-none" />
              <div className="w-24 h-24 bg-white border border-zinc-800 rounded-lg flex items-center justify-center relative p-1.5">
                <QRCodeSVG value={orderNumber || "FO-12345"} size={80} level="M" />
              </div>
            </div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest select-none">Scan to Claim</span>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 w-full px-4">
          <Button
            onClick={handleNewOrder}
            className="w-full sm:flex-1 bg-transparent hover:bg-zinc-900/60 border border-primary/40 text-[11px] font-black text-primary uppercase h-12 rounded-xl transition-all shadow-inner tracking-wider flex items-center justify-center gap-1.5"
          >
            Place Another Order
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="w-full sm:flex-1 text-[11px] font-black uppercase text-zinc-400 hover:text-white h-12 rounded-xl tracking-wider transition-colors flex items-center justify-center"
          >
            Back to Home
          </Button>
        </div>

      </div>
    );
  }

  return null;
}