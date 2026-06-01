"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clearCart, removeFromCart, incrementQuantity, decrementQuantity } from "@/lib/redux/slices/foodCartSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFoodOrderToBooking, createStandaloneFoodOrder, validateMenuItems } from "../actions";
import { checkCustomerExists } from "../../booking/actions";
import { Loader2, ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CheckCircle2, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

type Step = "cart" | "customer" | "success";

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

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty", { description: "Add items to your cart first" });
      return;
    }

    // If we have booking context, skip customer details
    if (bookingContext.bookingId) {
      handlePlaceOrder();
    } else {
      setStep("customer");
    }
  };

  const handleCustomerDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim() || phone.length < 10) {
      toast.error("Invalid phone number");
      return;
    }

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Check if customer exists
    const result = await checkCustomerExists(phone);
    if (result.exists && result.customer) {
      setName(result.customer.name);
      setEmail(result.customer.email || "");
      toast.success("Welcome back!", { description: `Hey ${result.customer.name}!` });
    }

    handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    // Validate items first
    const validationResult = await validateMenuItems(
      cartItems.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }))
    );

    if (!validationResult.success) {
      toast.error("Some items are unavailable", {
        description: validationResult.error,
      });
      setIsSubmitting(false);
      return;
    }

    let result;

    if (bookingContext.bookingId) {
      // Add to existing booking
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
      // Create standalone food order
      result = await createStandaloneFoodOrder(
        phone,
        name,
        email || null,
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
      if (result.bookingNumber) {
        setOrderNumber(result.bookingNumber);
      }
      toast.success("Order placed successfully!");
      setStep("success");
    } else {
      toast.error("Order failed", { description: result.error });
    }

    setIsSubmitting(false);
  };

  const handleNewOrder = () => {
    dispatch(clearCart());
    router.push("/food");
  };

  if (cartItems.length === 0 && step !== "success") {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Card className="bg-[#111] border-zinc-900 p-12 max-w-md mx-auto">
          <div className="text-center space-y-4">
            <ShoppingCart className="h-16 w-16 text-zinc-700 mx-auto" />
            <h2 className="text-xl font-black text-zinc-600 uppercase">Cart is Empty</h2>
            <p className="text-sm text-zinc-600">Add items to your cart to place an order</p>
            <Button onClick={() => router.push("/food")} className="bg-primary hover:bg-primary-hover text-black font-black uppercase">
              Browse Menu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "cart") {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        <div>
          <Button onClick={() => router.back()} variant="ghost" className="mb-4 text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">Your Cart</h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">Review your order before checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.menu_item_id} className="bg-[#111] border-zinc-900 p-4">
                <div className="flex gap-4">
                  {item.image_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-950 flex-shrink-0">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{item.category}</p>
                    <p className="text-base font-black text-primary mt-2">₹{item.price}</p>
                  </div>
                  <div className="flex flex-col gap-3 items-end">
                    <button onClick={() => dispatch(removeFromCart(item.menu_item_id))} className="p-1 text-red-500 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 p-1 rounded-lg">
                      <button onClick={() => dispatch(decrementQuantity(item.menu_item_id))} className="p-1 text-zinc-500 hover:text-white">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-black text-white min-w-[28px] text-center">{item.quantity}</span>
                      <button onClick={() => dispatch(incrementQuantity(item.menu_item_id))} className="p-1 text-black bg-primary hover:bg-primary-hover rounded">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-[#111] border-zinc-900 p-6 space-y-6 sticky top-6">
              <h3 className="text-sm font-black uppercase text-zinc-400 border-b border-zinc-900 pb-3">Order Summary</h3>

              {bookingContext.bookingNumber && (
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <p className="text-[9px] text-zinc-600 uppercase mb-1">Adding to Booking</p>
                  <p className="text-xs font-black text-primary font-mono">{bookingContext.bookingNumber}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{bookingContext.customerName}</p>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span className="text-white font-bold">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between font-black text-white pt-3 border-t border-zinc-900 text-lg">
                  <span>TOTAL</span>
                  <span className="text-primary">₹{cartTotal}</span>
                </div>
              </div>

              <Button onClick={handleProceedToCheckout} disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase py-6">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {bookingContext.bookingId ? "Add to Booking" : "Proceed to Checkout"}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (step === "customer") {
    return (
      <div className="max-w-xl mx-auto py-6 px-4">
        <Card className="bg-[#111] border-zinc-900 p-6 space-y-6">
          <div className="border-b border-zinc-900 pb-4">
            <h3 className="text-lg font-black uppercase text-white">Customer Details</h3>
            <p className="text-xs text-zinc-500 mt-1">Enter your contact information</p>
          </div>

          <form onSubmit={handleCustomerDetailsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[11px] font-black text-zinc-400 uppercase flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Mobile Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 border-r border-zinc-900 pr-2">+91</span>
                <Input id="phone" type="tel" required maxLength={10} placeholder="10-digit phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="bg-zinc-950 border-zinc-900 h-12 pl-12 text-white font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-black text-zinc-400 uppercase flex items-center gap-1.5">
                <User className="h-3 w-3" /> Full Name <span className="text-red-500">*</span>
              </Label>
              <Input id="name" type="text" required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-950 border-zinc-900 h-12 text-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-black text-zinc-400 uppercase flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <Input id="email" type="email" placeholder="email@example.com (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-950 border-zinc-900 h-12 text-white" />
            </div>

            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-900">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-500">Total Amount</span>
                <span className="text-primary font-black text-lg">₹{cartTotal}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase h-12">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Place Order
              </Button>
              <Button type="button" onClick={() => setStep("cart")} variant="ghost" className="w-full border border-zinc-900 text-zinc-400 hover:text-white">
                ← Back to Cart
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <Card className="bg-[#111] border-green-500/20 p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase text-white">Order Confirmed!</h3>
              <p className="text-sm text-zinc-400 mt-2">Your food order has been placed successfully</p>
            </div>
          </div>

          {orderNumber && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
              <p className="text-[10px] text-zinc-600 uppercase mb-1">Order Number</p>
              <p className="text-xl font-black text-primary font-mono">{orderNumber}</p>
            </div>
          )}

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-3">Order Summary</h4>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.menu_item_id} className="flex justify-between text-sm">
                  <span className="text-zinc-400">{item.name} x{item.quantity}</span>
                  <span className="text-white font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-white pt-2 border-t border-zinc-900">
                <span>TOTAL</span>
                <span className="text-primary">₹{cartTotal}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={handleNewOrder} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase h-12">
              Place Another Order
            </Button>
            <Button onClick={() => router.push("/")} variant="ghost" className="w-full text-zinc-600 hover:text-zinc-400">
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
