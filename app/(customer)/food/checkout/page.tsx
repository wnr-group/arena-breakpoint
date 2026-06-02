"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  clearCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity
} from "@/lib/redux/slices/foodCartSlice";
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
import {
  Loader2,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Sparkles,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

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
  }));

  const [step, setStep] = useState<Step>("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState(bookingContext.customerPhone || "");
  const [name, setName] = useState(bookingContext.customerName || "");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (bookingContext.customerPhone) setPhone(bookingContext.customerPhone);
    if (bookingContext.customerName) setName(bookingContext.customerName);
  }, [bookingContext.customerPhone, bookingContext.customerName]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const handleProceedToCheckout = () => {
    if (bookingContext.bookingId) {
      submitOrderPayload(bookingContext.customerPhone || phone, bookingContext.customerName || name, null);
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
      toast.success("Welcome back!", { description: `Hey ${result.customer.name}! Profile authenticated successfully.` });

      await submitOrderPayload(phone, result.customer.name, result.customer.email || null);
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
    await submitOrderPayload(phone, name, email.trim() || null);
  };

  const submitOrderPayload = async (targetPhone: string, targetName: string, targetEmail: string | null) => {
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
        cartItems.map((item) => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        }))
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
      <div className="h-[60vh] flex items-center justify-center bg-black">
        <Card className="bg-[#111] border-zinc-900 p-12 max-w-md mx-auto rounded-xl">
          <div className="text-center space-y-4">
            <ShoppingCart className="h-16 w-16 text-zinc-700 mx-auto" />
            <h2 className="text-xl font-black text-zinc-400 uppercase">Cart is Empty</h2>
            <p className="text-sm text-zinc-600">Add items to your cart to place an order</p>
            <Button onClick={() => router.push("/food")} className="bg-primary hover:bg-primary-hover text-black font-black uppercase px-6 py-4 rounded-xl">
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
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <span>Home</span><ChevronRight className="h-2.5 w-2.5 text-zinc-700" />
            <span>Food Menu</span><ChevronRight className="h-2.5 w-2.5 text-zinc-700" />
            <span className="text-primary">Cart</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight mt-2">
            Your Cart <span className="text-zinc-500 font-medium text-lg lowercase font-sans">Items ({cartItemCount})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3.5">
            {cartItems.map((item) => (
              <Card key={item.menu_item_id} className="bg-[#121214] border border-zinc-900 p-4 rounded-xl flex items-center justify-between gap-4 transition-all hover:border-zinc-800">
                <div className="flex items-center gap-4 min-w-0">
                  {item.image_url ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0 border border-zinc-900/60">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-900/60 flex items-center justify-center text-zinc-800 flex-shrink-0">
                      <Sparkles className="h-4 w-4 opacity-30" />
                    </div>
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-black text-sm text-zinc-100 truncate tracking-wide">{item.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest select-none">{item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-shrink-0 select-none">
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 p-2 rounded-xl">
                    <button type="button" onClick={() => dispatch(decrementQuantity(item.menu_item_id))} className="h-7 w-7 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"><Minus className="h-3 w-3" /></button>
                    <span className="text-xs font-black text-zinc-200 w-6 text-center font-mono">{item.quantity}</span>
                    <button type="button" onClick={() => dispatch(incrementQuantity(item.menu_item_id))} className="h-7 w-7 flex items-center justify-center text-black bg-primary rounded hover:bg-primary-hover ml-2 transition-all"><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="text-xl font-mono font-black text-primary min-w-[55px] text-right">₹{item.price * item.quantity}</span>
                  <button type="button" onClick={() => dispatch(removeFromCart(item.menu_item_id))} className="text-zinc-600 hover:text-red-400 transition-colors pl-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}

            <button type="button" onClick={() => router.push("/food")} className="flex items-center gap-2 text-xs font-black uppercase text-zinc-300 hover:text-primary pt-2 select-none tracking-wider transition-colors">
              ← Continue Shopping
            </button>
          </div>

          <div className="lg:col-span-5">
            <Card className="bg-[#121214] border border-zinc-900 p-6 space-y-5 rounded-2xl shadow-2xl">
              <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wider pb-2 border-b border-zinc-900/60">Order Summary</h3>
              <div className="space-y-3.5 text-xs text-zinc-400">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-zinc-200 font-mono font-bold">₹{cartTotal}</span></div>
                <div className="flex justify-between items-baseline font-black text-white pt-4 border-t border-zinc-900">
                  <span className="text-xs uppercase text-zinc-400 font-black">Total</span>
                  <span className="text-2xl text-primary font-mono tracking-tight">₹{cartTotal}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Promo Code</Label>
                <div className="flex gap-2">
                  <Input placeholder="Enter code" className="bg-zinc-950 border-zinc-900 h-10 text-xs text-zinc-500 rounded-xl" />
                  <Button variant="outline" className="border-zinc-800 text-[10px] font-black bg-primary uppercase h-10 px-4 text-zinc-600 rounded-xl">Apply</Button>
                </div>
              </div>

              <Button onClick={handleProceedToCheckout} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl shadow-xl shadow-primary/5 tracking-wider active:scale-[0.99] transition-transform">
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
        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6">
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">CUSTOMER IDENTIFICATION</h3>
            <p className="text-xs text-zinc-500 font-medium">Enter your mobile number to load profiles or route standalone orders.</p>
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
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-xl transition-all">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "CONTINUE"} <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="w-full max-w-xl mx-auto py-4 px-2 animate-in fade-in duration-300">
        <Card className="bg-[#111] border border-zinc-900 p-6 shadow-2xl rounded-2xl space-y-6">
          <div className="border-b border-zinc-900 pb-4 space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight">NEW CUSTOMER REGISTRATION</h3>
            <p className="text-xs text-zinc-500 font-medium">Please provide your credentials to map this checkout profile transaction.</p>
          </div>

          <form onSubmit={handleNewCustomerSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><User className="h-3 w-3 text-zinc-600" /> FULL NAME <span className="text-red-500">*</span></Label>
              <Input id="name" type="text" required placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Mail className="h-3 w-3 text-zinc-600" /> EMAIL ADDRESS</Label>
              <Input id="email" type="email" placeholder="Enter your email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-950 border-zinc-900 h-12 text-sm text-white focus-visible:ring-primary rounded-xl" />
            </div>

            <div className="pt-4 space-y-2">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "PLACE ARENA ORDER"} <ChevronRight className="h-4 w-4 stroke-[3]" />
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
          <Card className="bg-[#111113] border border-zinc-900 p-6 md:col-span-2 flex flex-col justify-between min-h-[220px] relative overflow-hidden rounded-xl shadow-2xl">
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start w-full">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Order ID</span>
                  <span className="text-base font-black text-white font-mono tracking-wide">#{orderNumber || "FO-12345"}</span>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Status</span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" /> Paid Successfully
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
                <div className="flex justify-between items-baseline font-black text-white pt-2.5 border-t border-zinc-900/40 text-sm">
                  <span className="text-[10px] uppercase text-zinc-400 font-black tracking-wider">Amount Paid</span>
                  <span className="text-base text-primary font-mono tracking-tight">₹{cartTotal}.00</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-[#111113] border border-zinc-900 p-5 flex flex-col items-center justify-center text-center space-y-4 rounded-xl shadow-2xl group/qr">
            <div className="p-2 bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-primary rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,193,7,0.1)] w-36 h-36 relative overflow-hidden group-hover/qr:shadow-[0_0_25px_rgba(255,193,7,0.2)] transition-all duration-300">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,193,7,0.08)_0%,transparent_70%)] pointer-events-none" />
              <div className="w-24 h-24 bg-white border border-zinc-800 rounded-lg flex items-center justify-center relative p-1.5">
                <QRCodeSVG value={orderNumber || "FO-12345"} size={80} level="M" />
              </div>
            </div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest select-none">Scan to Claim</span>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2 w-full max-w-lg">
          <Button
            onClick={handleNewOrder}
            className="flex-1 mr-10 bg-transparent hover:bg-zinc-900/60 border border-primary/40 text-[11px] font-black text-primary uppercase h-11 px-6 rounded-xl transition-all shadow-inner tracking-wider flex items-center justify-center gap-1.5"
          >
            Place Another Order
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-[11px] font-black uppercase text-zinc-400 hover:text-white h-11 px-4 tracking-wider transition-colors"
          >
            Back to Home
          </Button>
        </div>

      </div>
    );
  }

  return null;
}