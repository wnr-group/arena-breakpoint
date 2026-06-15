"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Minus, ShoppingCart, UtensilsCrossed, Coffee, Pizza } from "lucide-react";
import { toast } from "sonner";
import { getMenuItems, addFoodToBooking } from "./actions";

export default function FoodOrderPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

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
      toast.success("Order Placed!", { description: "Your food order has been added to the booking." });
      router.push(`/my-bookings?phone=${result.phone || ""}`);
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

  return (
    <div className="min-h-screen bg-[#0d0a14] text-white pb-24">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            ORDER FOOD & DRINKS
          </h1>
          <p className="text-sm text-zinc-500">Add food items to your booking</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-xs font-black uppercase border rounded-lg transition-all whitespace-nowrap ${
                activeCategory === category
                  ? "bg-primary text-black border-transparent"
                  : "bg-[#111] border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const inCart = cart[item.id];
            const isAvailable = item.status === 'available';

            return (
              <Card key={item.id} className={`bg-[#111] border overflow-hidden ${isAvailable ? 'border-zinc-900 hover:border-primary/50' : 'border-zinc-900/50 opacity-60'} transition-all glow-box-hover`}>
                {/* Image */}
                {item.image_url && (
                  <div className="h-40 w-full bg-zinc-950 overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black uppercase text-white">{item.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                        item.category === 'Snacks' ? 'bg-orange-500/10 text-orange-500' :
                        item.category === 'Drinks' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-primary">₹{item.price}</span>

                    {isAvailable ? (
                      inCart ? (
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-1 rounded-lg">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-zinc-500 hover:text-white transition-all"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-black text-white w-6 text-center">{inCart.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1 text-black bg-primary hover:bg-primary-hover rounded transition-all"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addToCart(item)}
                          size="sm"
                          className="bg-primary hover:bg-primary-hover text-black font-bold uppercase text-xs h-8 px-3 rounded-lg"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
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
        <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-zinc-900 p-4 shadow-2xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-black rounded-full w-8 h-8 flex items-center justify-center font-black text-sm">
                {cartItemsCount}
              </div>
              <div>
                <p className="text-xs text-zinc-500">Cart Total</p>
                <p className="text-lg font-black text-white">₹{cartTotal}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setCart({})}
                variant="ghost"
                className="border border-zinc-800 text-zinc-500 hover:text-white font-bold uppercase text-xs h-12 px-6"
              >
                Clear Cart
              </Button>
              <Button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 px-8 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Place Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
