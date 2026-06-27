"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Minus, ShoppingCart, UtensilsCrossed, Coffee, Pizza } from "lucide-react";
import { toast } from "sonner";
import { getMenuItems, addFoodToBooking } from "./actions";

export default function FoodOrderPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.bookingId as string;
  const returnUrl = searchParams.get("returnUrl");

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: { item: any; quantity: number } }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    const result = await getMenuItems();
    if (result.success) {
      setMenuItems(result.items || []);
    } else {
      toast.error("Error", { description: "Failed to load menu items." });
    }
    setIsLoading(false);
  };

  const categories = ["All", "Snacks", "Drinks", "Meals"];

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return menuItems;
    return menuItems.filter(item => item.category === activeCategory);
  }, [menuItems, activeCategory]);

  const addToCart = (item: any) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        item,
        quantity: (prev[item.id]?.quantity || 0) + 1
      }
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[itemId].quantity > 1) {
        updated[itemId].quantity--;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce((sum, { item, quantity }) => sum + (item.price * quantity), 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return Object.values(cart).reduce((sum, { quantity }) => sum + quantity, 0);
  }, [cart]);

  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<any[]>([]);

  const handleSubmitOrder = async () => {
    if (cartItemsCount === 0) {
      toast.error("Cart Empty", { description: "Please add items to your cart." });
      return;
    }

    setIsSubmitting(true);

    const foodItems = Object.values(cart).map(({ item, quantity }) => ({
      menu_item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      quantity,
      unit_price: item.price,
      line_total: item.price * quantity
    }));

    const result = await addFoodToBooking(bookingId, foodItems);

    if (result.success) {
      setConfirmedItems(foodItems);
      setOrderConfirmed(true);
      toast.success("Order Placed!", { description: "Your food order has been added to the booking." });
    } else {
      toast.error("Order Failed", { description: result.error || "Something went wrong." });
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0a14] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Order Confirmation View
  if (orderConfirmed) {
    return (
      <div className="w-full max-w-2xl mx-auto py-4 px-2 animate-in fade-in duration-500">
        <Card className="bg-[#111] border border-green-500/20 p-8 shadow-2xl rounded-2xl space-y-6 glow-box-strong">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                <UtensilsCrossed className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase text-white tracking-tight">ORDER CONFIRMED!</h3>
              <p className="text-sm text-zinc-400">Your food order has been successfully placed.</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3 text-sm glow-box-hover">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase">Order Items</h4>
            {confirmedItems.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-zinc-500">{item.item_name} (x{item.quantity}):</span>
                <span className="text-white font-bold">₹{item.line_total.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-zinc-800 pt-2 font-black">
              <span className="text-zinc-500">Total Amount:</span>
              <span className="text-white">₹{confirmedItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={() => {
                if (returnUrl) {
                  router.push(returnUrl);
                } else {
                  router.push(`/my-bookings/${bookingId}`);
                }
              }}
              variant="gradient"
              className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              VIEW BOOKING DETAILS
            </Button>
            <Button
              onClick={() => {
                setOrderConfirmed(false);
                setCart({});
                setConfirmedItems([]);
              }}
              variant="ghost"
              className="w-full border-2 border-primary text-zinc-300 hover:text-zinc-300 font-bold uppercase text-[11px] h-11 rounded-xl"
            >
              ORDER MORE ITEMS
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="w-full text-zinc-300 border border-zinc-800 hover:text-zinc-400 font-bold uppercase text-[11px] h-10 rounded-xl"
            >
              BACK TO HOME
            </Button>
          </div>

          {/* Footer Note */}
          <div className="pt-2 flex gap-2 items-center text-[10px] text-zinc-600 justify-center border-t border-zinc-950">
            <UtensilsCrossed className="h-3.5 w-3.5 text-zinc-700" />
            <span>Your food order will be prepared and served at your station</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-32 md:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            ORDER FOOD & DRINKS
          </h1>
          <p className="text-sm text-zinc-500">Add food items to your booking</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2.5 text-xs font-black uppercase border rounded-xl transition-all whitespace-nowrap ${
                activeCategory === category
                  ? "bg-gradient-primary text-[var(--button-text)] border-primary"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const inCart = cart[item.id];
            const isAvailable = item.status === 'available';

            return (
              <Card key={item.id} className={`bg-[#111] border overflow-hidden rounded-xl ${isAvailable ? 'border-zinc-900 hover:border-primary/50' : 'border-zinc-900/50 opacity-60'} transition-all glow-box-hover`}>
                {/* Image */}
                {item.image_url && (
                  <div className="h-36 md:h-40 w-full bg-zinc-950 overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 md:p-5 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm md:text-base font-black uppercase text-white leading-tight">{item.name}</h3>
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase whitespace-nowrap ${
                        item.category === 'Snacks' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30' :
                        item.category === 'Drinks' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
                        'bg-green-500/10 text-green-500 border border-green-500/30'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-black text-primary">₹{item.price}</span>

                    {isAvailable ? (
                      inCart ? (
                        <div className="flex items-center gap-2 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-1.5 rounded-lg shadow-md">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-black text-primary w-8 text-center">{inCart.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1.5 bg-gradient-primary text-[var(--button-text)] rounded transition-all hover:scale-110"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addToCart(item)}
                          size="sm"
                          className="bg-gradient-primary text-[var(--button-text)] font-black uppercase text-xs h-9 px-4 rounded-lg"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                      )
                    ) : (
                      <span className="text-xs font-bold text-zinc-600 uppercase">Out of Stock</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <Card className="bg-[#111] border border-zinc-900 p-12 text-center">
            <Coffee className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No items available in this category.</p>
          </Card>
        )}

      </div>

      {/* Fixed Bottom Cart Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0d0a14] border-t border-zinc-900 p-4 md:p-5 shadow-2xl z-50 backdrop-blur-lg bg-opacity-95">
          <div className="max-w-6xl mx-auto">
            {/* Mobile Layout */}
            <div className="flex md:hidden flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-black rounded-full w-9 h-9 flex items-center justify-center font-black text-sm">
                    {cartItemsCount}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold">Cart Total</p>
                    <p className="text-xl font-black text-primary">₹{cartTotal}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setCart({})}
                  variant="outline"
                  size="sm"
                  className="text-xs h-9"
                >
                  Clear
                </Button>
              </div>
              <Button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full bg-gradient-primary text-[var(--button-text)] font-black uppercase text-sm h-12 rounded-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Place Order
              </Button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary text-black rounded-full w-10 h-10 flex items-center justify-center font-black text-base">
                  {cartItemsCount}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold">Cart Total</p>
                  <p className="text-xl font-black text-primary">₹{cartTotal}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCart({})}
                  variant="outline"
                  className="font-bold uppercase text-xs h-12 px-6"
                >
                  Clear Cart
                </Button>
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="bg-gradient-primary text-[var(--button-text)] font-black uppercase text-sm h-12 px-8 flex items-center gap-2 rounded-xl"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  Place Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
