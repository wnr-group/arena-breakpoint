"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { BreakpointLoader } from "@/components/shared/BreakpointLoader";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  setBookingContext,
  clearCart,
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
  ChevronRight,
  ShoppingBag,
  Star,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

function FoodMenuPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.foodCart.items);
  const bookingNumber = useAppSelector((state) => state.foodCart.bookingNumber);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCartListOpen, setIsCartListOpen] = useState(false);

  // Dynamically set main element z-index to ensure the fixed cart bar stays above the footer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mainEl = document.querySelector('main');
    if (cartItemCount > 0) {
      if (mainEl) mainEl.style.zIndex = '50';
    } else {
      if (mainEl) mainEl.style.zIndex = '';
    }
    return () => {
      if (mainEl) mainEl.style.zIndex = '';
    };
  }, [cartItemCount]);

  useEffect(() => {
    const urlBookingId = searchParams.get("bookingId");
    const urlBookingNumber = searchParams.get("bookingNumber");
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const dob = searchParams.get("date_of_birth");

    if (urlBookingId && urlBookingNumber && phone && name) {
      dispatch(
        setBookingContext({
          bookingId: urlBookingId,
          bookingNumber: urlBookingNumber,
          customerPhone: phone,
          customerName: name,
          customerDob: dob || ""
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

    if (menuResult.success) setMenuItems(menuResult.menuItems);
    if (categoriesResult.success) setCategories(categoriesResult.categories);
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
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);



  const getCartItemQuantity = (menuItemId: string) => {
    return cartItems.find((item) => item.menu_item_id === menuItemId)?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center bg-[#0d0a14]">
        <Loader2 className="h-7 w-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 space-y-8 pb-36 animate-in fade-in duration-300">

      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 select-none">
        <span>Home</span>
        <ChevronRight className="h-3 w-3 text-zinc-700" />
        <span className="text-primary">Respawn Refuel</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,193,7,0.3)]">
            Respawn Refuel ⚡
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Recharge between matches with premium snacks, meals, and beverages crafted for champions.
          </p>
        </div>

        {bookingNumber && (
          <div className="bg-[#111] border border-zinc-800/80 px-4 py-2 rounded-xl flex items-center gap-3 shadow-inner glow-box-hover">
            <div>
              <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Active Hub Track</p>
              <p className="text-xs font-black text-primary font-mono tracking-wide">{bookingNumber}</p>
            </div>
            <div className="h-6 w-[1px] bg-zinc-800" />
            <ShoppingBag className="h-4 w-4 text-zinc-500" />
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-[#0c0c0e]/60 p-4 rounded-2xl border border-zinc-900/80">
        <div className="flex gap-2 overflow-x-auto w-full xl:w-auto scrollbar-none py-0.5">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-2.5 text-xs font-black uppercase border rounded-xl transition-all duration-300 whitespace-nowrap ${activeCategory === "all"
                ? "bg-gradient-primary text-[var(--button-text)] border-primary"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 text-xs font-black uppercase border rounded-xl transition-all duration-300 whitespace-nowrap ${activeCategory === category
                  ? "bg-gradient-primary text-[var(--button-text)] border-primary"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="relative group w-full xl:max-w-xs flex-shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800/80 text-xs font-medium text-white h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Menu Categories Grid Loop Output */}
      {Object.keys(groupedItems).length === 0 ? (
        <Card className="bg-[#111]/40 border-zinc-900 p-16 rounded-2xl shadow-xl glow-box-hover">
          <div className="text-center space-y-3 max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-700 flex items-center justify-center mx-auto">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Items Available</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">We couldn't locate anything matching your criteria. Try resetting filters or adjust typing variables.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-5">
              <div className="flex items-center gap-2 pl-1 select-none">
                <span className="w-1.5 h-1.5 bg-primary rounded-full block shadow-[0_0_8px_var(--primary)]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-200">
                  {category}
                </h2>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-zinc-900 to-transparent ml-2" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((item) => {
                  const quantityInCart = getCartItemQuantity(item.id);

                  return (
                    <Card
                      key={item.id}
                      className="bg-[#111] border border-zinc-900/90 overflow-hidden group hover:border-zinc-800/80 transition-all duration-300 flex flex-col rounded-xl relative shadow-lg glow-box-hover"
                    >
                      <div className="h-48 w-full overflow-hidden relative bg-zinc-950 flex-shrink-0 border-b border-zinc-900/60">
                        {item.image_url ? (
                          <>
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 bg-zinc-950 select-none">
                            <Sparkles className="h-6 w-6 opacity-30 animate-pulse" />
                            <span className="text-[9px] uppercase tracking-widest font-black mt-1">Arena Item</span>
                          </div>
                        )}

                        {item.quantity <= 10 && item.quantity > 0 && (
                          <span className="absolute top-3 right-3 z-10 inline-flex items-center px-2 py-0.5 text-[8px] font-black text-white bg-red-600 border border-red-500/20 rounded uppercase tracking-wider scale-90">
                            LOW STOCK
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-black text-sm text-zinc-100 group-hover:text-primary transition-colors tracking-tight line-clamp-1" title={item.name}>
                              {item.name}
                            </h3>
                          </div>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-medium">
                            {item.description || "Premium operational live kitchen item configuration prepared fresh to order."}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 w-full">
                          <span className="text-sm font-black text-primary font-mono">
                            ₹{Number(item.price)}.00
                          </span>

                          <div className="w-[110px] flex justify-end">
                            {quantityInCart > 0 ? (
                              <div className="flex items-center bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-1 rounded-lg w-full shadow-md animate-in zoom-in-95 duration-150">
                                <button
                                  type="button"
                                  onClick={() => dispatch(decrementQuantity(item.id))}
                                  className="h-6 w-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-black text-primary flex-1 text-center font-mono">
                                  {quantityInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => dispatch(incrementQuantity(item.id))}
                                  className="h-6 w-6 flex items-center justify-center rounded-md bg-gradient-primary text-[var(--button-text)] transition-all hover:scale-110"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item)}
                                disabled={item.quantity === 0}
                                className="h-8 w-8 bg-gradient-primary text-[var(--button-text)] flex items-center justify-center rounded-lg shadow-sm active:scale-95 transition-all disabled:bg-zinc-900 disabled:text-zinc-700 disabled:border-transparent cursor-pointer"
                              >
                                <ShoppingCart className="h-3.5 w-3.5 stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0a14] border-t border-zinc-900 p-4 md:p-5 shadow-2xl backdrop-blur-lg bg-opacity-95">
          <div className="max-w-6xl mx-auto">
            {/* Expanded Cart Items List */}
            {isCartListOpen && (
              <div className="mb-4 max-h-60 overflow-y-auto border-b border-zinc-900 pb-4 space-y-2.5 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-900/60">
                  <span>Selected Food Items</span>
                  <span>Quantity & Price</span>
                </div>
                {cartItems.map((item) => (
                  <div key={item.menu_item_id} className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-900/10">
                    <span className="text-white font-bold uppercase text-xs">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-md p-1 shadow-md">
                        <button
                          type="button"
                          onClick={() => dispatch(decrementQuantity(item.menu_item_id))}
                          className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black text-primary w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => dispatch(incrementQuantity(item.menu_item_id))}
                          className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-primary font-black text-xs min-w-[60px] text-right">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mobile Layout */}
            <div className="flex md:hidden flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-black rounded-full w-9 h-9 flex items-center justify-center font-black text-sm">
                    {cartItemCount}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold">Cart Total</p>
                    <p className="text-xl font-black text-primary">₹{cartTotal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsCartListOpen(!isCartListOpen)}
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                  >
                    {isCartListOpen ? "Hide Items" : "View Items"}
                  </Button>
                  <Button
                    onClick={() => {
                      dispatch(clearCart());
                      setIsCartListOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 border-zinc-800 text-red-400 hover:bg-red-950/20"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => router.push("/food/checkout")}
                className="w-full bg-gradient-primary text-[var(--button-text)] font-black uppercase text-sm h-12 rounded-xl flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Your Cart
              </Button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary text-black rounded-full w-10 h-10 flex items-center justify-center font-black text-base">
                  {cartItemCount}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold">Cart Total</p>
                  <p className="text-xl font-black text-primary">₹{cartTotal}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setIsCartListOpen(!isCartListOpen)}
                  variant="outline"
                  className="font-bold uppercase text-xs h-12 px-6 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                >
                  {isCartListOpen ? "Hide Items" : "View Items"}
                </Button>
                <Button
                  onClick={() => {
                    dispatch(clearCart());
                    setIsCartListOpen(false);
                  }}
                  variant="outline"
                  className="font-bold uppercase text-xs h-12 px-6 border-zinc-800 text-red-400 hover:bg-red-950/20"
                >
                  Clear Cart
                </Button>
                <Button
                  onClick={() => router.push("/food/checkout")}
                  className="bg-gradient-primary text-[var(--button-text)] font-black uppercase text-sm h-12 px-8 flex items-center gap-2 rounded-xl"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Your Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FoodMenuPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#0d0a14]"><BreakpointLoader size="md" /></div>}>
      <FoodMenuPageContent />
    </Suspense>
  );
}