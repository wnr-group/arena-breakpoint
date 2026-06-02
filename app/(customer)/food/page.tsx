"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  setBookingContext,
} from "@/lib/redux/slices/foodCartSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getMenuItems, getMenuCategories } from "./actions";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  UtensilsCrossed,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";

function FoodMenuPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.foodCart.items);
  const bookingId = useAppSelector((state) => state.foodCart.bookingId);
  const bookingNumber = useAppSelector((state) => state.foodCart.bookingNumber);
  const customerPhone = useAppSelector((state) => state.foodCart.customerPhone);
  const customerName = useAppSelector((state) => state.foodCart.customerName);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    // Check if coming from booking
    const urlBookingId = searchParams.get("bookingId");
    const urlBookingNumber = searchParams.get("bookingNumber");
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");

    if (urlBookingId && urlBookingNumber && phone && name) {
      dispatch(
        setBookingContext({
          bookingId: urlBookingId,
          bookingNumber: urlBookingNumber,
          customerPhone: phone,
          customerName: name,
        })
      );
    }

    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    setLoading(true);
    const [menuResult, categoriesResult] = await Promise.all([
      getMenuItems({ availableOnly: true }),
      getMenuCategories(),
    ]);

    if (menuResult.success) {
      setMenuItems(menuResult.menuItems);
    }

    if (categoriesResult.success) {
      setCategories(categoriesResult.categories);
    }

    setLoading(false);
  };

  const handleAddToCart = (item: any) => {
    dispatch(
      addToCart({
        menu_item_id: item.id,
        name: item.name,
        category: item.category,
        price: Number(item.price),
        image_url: item.image_url,
      })
    );
    toast.success(`${item.name} added to cart`);
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const getCartItemQuantity = (menuItemId: string) => {
    return cartItems.find((item) => item.menu_item_id === menuItemId)?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6 pb-32">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tight">
              FOOD & BEVERAGES
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Order delicious food and drinks
            </p>
          </div>
          {bookingNumber && (
            <div className="bg-[#111] border border-zinc-900 px-4 py-2 rounded-lg">
              <p className="text-[9px] text-zinc-600 uppercase">Booking</p>
              <p className="text-xs font-black text-primary font-mono">
                {bookingNumber}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#111] border-zinc-900 text-white h-12"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 text-[11px] font-black uppercase border rounded-lg transition-all whitespace-nowrap ${
              activeCategory === "all"
                ? "bg-primary text-black border-transparent"
                : "bg-[#111] border-zinc-900 text-zinc-400"
            }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-[11px] font-black uppercase border rounded-lg transition-all whitespace-nowrap ${
                activeCategory === category
                  ? "bg-primary text-black border-transparent"
                  : "bg-[#111] border-zinc-900 text-zinc-400"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      {Object.keys(groupedItems).length === 0 ? (
        <Card className="bg-[#111] border-zinc-900 p-12">
          <div className="text-center space-y-2">
            <UtensilsCrossed className="h-12 w-12 text-zinc-700 mx-auto" />
            <h3 className="text-lg font-black text-zinc-600 uppercase">
              No Items Found
            </h3>
            <p className="text-sm text-zinc-600">
              Try adjusting your search or filters
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full" />
                {category}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item) => {
                  const quantityInCart = getCartItemQuantity(item.id);

                  return (
                    <Card
                      key={item.id}
                      className="bg-[#111] border-zinc-900 overflow-hidden group hover:border-zinc-800 transition-all"
                    >
                      {item.image_url && (
                        <div className="h-32 w-full overflow-hidden border-b border-zinc-900">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-sm text-white truncate">
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-zinc-600 mt-0.5">
                            {item.category}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-primary">
                            ₹{Number(item.price)}
                          </span>
                          {item.quantity <= 10 && item.quantity > 0 && (
                            <span className="text-[9px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase font-black">
                              Only {item.quantity} left
                            </span>
                          )}
                        </div>

                        {quantityInCart > 0 ? (
                          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 p-1.5 rounded-lg">
                            <button
                              onClick={() => dispatch(decrementQuantity(item.id))}
                              className="p-1.5 text-zinc-500 hover:text-white transition-all"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-black text-white min-w-[24px] text-center">
                              {quantityInCart}
                            </span>
                            <button
                              onClick={() => dispatch(incrementQuantity(item.id))}
                              className="p-1.5 text-black bg-primary hover:bg-primary-hover rounded transition-all"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(item)}
                            disabled={item.quantity === 0}
                            className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-10"
                          >
                            {item.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => router.push("/food/checkout")}
            className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-sm h-14 px-6 rounded-full shadow-2xl flex items-center gap-3"
          >
            <ShoppingCart className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] leading-none">
                {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
              </span>
              <span className="text-base leading-none font-black">
                ₹{cartTotal}
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function FoodMenuPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <FoodMenuPageContent />
    </Suspense>
  );
}
