"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Phone,
  User,
  Mail,
  ShieldCheck,
  Cake,
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  Coffee,
  Pizza,
  Sandwich,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { checkCustomerExists } from "@/app/(customer)/booking/actions";
import { createFoodOnlyWalkInBooking } from "../actions";
import { formatDateForDB, handleDobInput, isValidDateDDMMYYYY } from "@/lib/utils/dates";
import { BreakpointLoader } from "@/components/shared/BreakpointLoader";

export default function WalkInFoodOnlyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Customer Lookup, 2: Food Selection, 3: Confirm

  // Customer details
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDob, setCustomerDob] = useState("");
  const [showFullRegistrationFields, setShowFullRegistrationFields] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Food items
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; price: number; quantity: number; category: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    setLoadingMenu(true);
    try {
      // Import the server action
      const { getMenuItems } = await import("@/app/(customer)/booking/[bookingId]/food/actions");
      const result = await getMenuItems();

      if (result.success && result.items) {
        setMenuItems(result.items);
      } else {
        toast.error("Failed to load menu items");
      }
    } catch (error) {
      console.error("Error loading menu:", error);
      toast.error("Failed to load menu items");
    }
    setLoadingMenu(false);
  };

  const handlePhoneLookup = async () => {
    if (customerPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setCheckingProfile(true);
    const result = await checkCustomerExists(customerPhone);

    if (result.exists && result.customer) {
      // Customer exists
      setCustomerName(result.customer.name);
      setCustomerEmail(result.customer.email || "");
      if (result.customer.date_of_birth) {
        // Convert from YYYY-MM-DD to DD-MM-YYYY for display
        const [year, month, day] = result.customer.date_of_birth.split("-");
        setCustomerDob(`${day}-${month}-${year}`);
      }
      setCustomerId(result.customer.id);
      setActiveSubscription(result.subscription || null);
      setShowFullRegistrationFields(false);
      toast.success(`Welcome back, ${result.customer.name}!`);
      setStep(2); // Move to food selection
    } else {
      // New customer
      setShowFullRegistrationFields(true);
      setCustomerId(null);
      setActiveSubscription(null);
      toast.info("New customer - please fill in details");
    }

    setCheckingProfile(false);
  };

  const handleRegisterAndProceed = () => {
    // Validate all fields
    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    if (!customerDob || !isValidDateDDMMYYYY(customerDob)) {
      toast.error("Please enter a valid date of birth (DD-MM-YYYY)");
      return;
    }

    setStep(2);
    toast.success("Customer details saved. Select food items.");
  };

  const addFoodItem = (item: any) => {
    const existing = selectedItems.find(i => i.id === item.id);
    const currentQuantity = existing?.quantity || 0;

    // Check if we can add more based on available stock
    if (currentQuantity >= item.quantity) {
      toast.error(`Only ${item.quantity} ${item.name} available in stock`);
      return;
    }

    // Check if item is in stock
    if (item.quantity <= 0) {
      toast.error(`${item.name} is out of stock`);
      return;
    }

    if (existing) {
      setSelectedItems(selectedItems.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        category: item.category
      }]);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    const menuItem = menuItems.find(m => m.id === itemId);
    const currentItem = selectedItems.find(i => i.id === itemId);

    if (change > 0 && menuItem && currentItem) {
      // Check stock limit when increasing
      if (currentItem.quantity >= menuItem.quantity) {
        toast.error(`Only ${menuItem.quantity} ${menuItem.name} available in stock`);
        return;
      }
    }

    setSelectedItems(selectedItems.map(i => {
      if (i.id === itemId) {
        const newQuantity = Math.max(0, i.quantity + change);
        return { ...i, quantity: newQuantity };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one food item");
      return;
    }

    setSubmitting(true);

    try {
      const dobForDB = customerDob ? formatDateForDB(customerDob) : null;

      const result = await createFoodOnlyWalkInBooking({
        customerPhone,
        customerName,
        customerEmail,
        customerDob: dobForDB,
        customerId,
        foodItems: selectedItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          notes: ""
        })),
        totalAmount
      });

      if (result.success) {
        toast.success("Food order created successfully!", {
          description: `Order #${result.bookingNumber}`
        });
        router.push("/admin/bookings");
      } else {
        toast.error("Failed to create order", { description: result.error });
      }
    } catch (error: any) {
      toast.error("Error creating order", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Snacks":
        return <Pizza className="h-4 w-4" />;
      case "Drinks":
        return <Coffee className="h-4 w-4" />;
      case "Meals":
        return <Sandwich className="h-4 w-4" />;
      default:
        return <UtensilsCrossed className="h-4 w-4" />;
    }
  };

  // Filter menu items
  const categories = ["All", "Snacks", "Drinks", "Meals"];
  const filteredMenuItems = activeCategory === "All"
    ? menuItems.filter(item => item.quantity > 0) // Only show items with stock
    : menuItems.filter(item => item.category === activeCategory && item.quantity > 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-black text-white">Food-Only Walk-In</h1>
            <p className="text-sm text-zinc-500">Create a food order without device booking</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-zinc-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? "bg-primary text-black" : "bg-zinc-800"}`}>1</div>
            <span className="text-sm font-bold">Customer</span>
          </div>
          <div className="h-0.5 w-12 bg-zinc-800"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-zinc-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? "bg-primary text-black" : "bg-zinc-800"}`}>2</div>
            <span className="text-sm font-bold">Food Items</span>
          </div>
          <div className="h-0.5 w-12 bg-zinc-800"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-zinc-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? "bg-primary text-black" : "bg-zinc-800"}`}>3</div>
            <span className="text-sm font-bold">Confirm</span>
          </div>
        </div>

        {/* Step 1: Customer Lookup */}
        {step === 1 && (
          <Card className="bg-[#111] border-zinc-900 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Customer Information</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="bg-zinc-950 border-zinc-800 text-white"
                    maxLength={10}
                  />
                  <Button
                    onClick={handlePhoneLookup}
                    disabled={checkingProfile || customerPhone.length < 10}
                    variant="default"
                    className="bg-primary text-black hover:bg-primary/90"
                  >
                    {checkingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Lookup
                  </Button>
                </div>
              </div>

              {showFullRegistrationFields && (
                <>
                  <div>
                    <Label className="text-zinc-400">Full Name *</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name"
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-zinc-400">Email *</Label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-zinc-400">Date of Birth (DD-MM-YYYY) *</Label>
                    <Input
                      value={customerDob}
                      onChange={(e) => setCustomerDob(handleDobInput(e.target.value))}
                      placeholder="DD-MM-YYYY"
                      className="bg-zinc-950 border-zinc-800 text-white"
                      maxLength={10}
                    />
                  </div>

                  <Button
                    onClick={handleRegisterAndProceed}
                    variant="gradient"
                    className="w-full"
                  >
                    Continue to Food Selection
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Step 2: Food Selection */}
        {step === 2 && (
          <div className="space-y-6 pb-32">
            {/* Menu Items */}
            <Card className="bg-[#111] border-zinc-900 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Menu
              </h3>

              {/* Category Filter with Icons */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 mb-4 border-b border-zinc-800">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2.5 text-xs font-black uppercase border rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                      activeCategory === category
                        ? "bg-gradient-primary text-[var(--button-text)] border-primary"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {category !== "All" && getCategoryIcon(category)}
                    {category}
                  </button>
                ))}
              </div>

              {loadingMenu ? (
                <div className="py-12 flex justify-center">
                  <BreakpointLoader size="lg" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMenuItems.map((item: any) => {
                    const inCart = selectedItems.find(i => i.id === item.id);
                    const isAvailable = item.status === 'available' && item.quantity > 0;

                    return (
                      <div
                        key={item.id}
                        className={`bg-zinc-950 border rounded-lg p-4 transition-colors ${
                          isAvailable ? 'border-zinc-800 hover:border-primary/50' : 'border-zinc-900/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h5 className="text-white font-bold">{item.name}</h5>
                            {item.description && (
                              <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-primary font-bold">₹{item.price}</p>
                              <span className="text-xs text-zinc-600">• Stock: {item.quantity}</span>
                            </div>
                          </div>
                          {isAvailable ? (
                            inCart ? (
                              <div className="flex items-center gap-1 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-1 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-sm font-black text-primary w-6 text-center">{inCart.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="p-1.5 bg-gradient-primary text-[var(--button-text)] rounded transition-all hover:scale-110"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => addFoodItem(item)}
                                size="sm"
                                className="bg-gradient-primary text-[var(--button-text)] font-black uppercase text-xs h-8 px-3"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            )
                          ) : (
                            <span className="text-xs font-bold text-zinc-600 uppercase">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredMenuItems.length === 0 && !loadingMenu && (
                <div className="py-12 text-center">
                  <Coffee className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">No items available in this category.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Fixed Bottom Cart Bar */}
        {step === 2 && selectedItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#0d0a14] border-t border-zinc-900 shadow-2xl z-50 backdrop-blur-lg bg-opacity-95">
            <div className="max-w-4xl mx-auto p-4">
              {/* Expanded Cart Items */}
              {isCartOpen && (
                <div className="mb-4 max-h-60 overflow-y-auto border-b border-zinc-900 pb-4 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-zinc-950 rounded-lg border border-zinc-800">
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-zinc-500">₹{item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-white font-bold w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="ml-3 text-primary font-bold text-sm">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart Summary Bar */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="flex items-center gap-2 text-white hover:text-primary transition-colors"
                >
                  {isCartOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  <div className="text-left">
                    <p className="text-xs text-zinc-500 font-bold uppercase">
                      {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} Items
                    </p>
                    <p className="text-lg font-black text-primary">₹{totalAmount.toFixed(2)}</p>
                  </div>
                </button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  variant="gradient"
                  className="flex-1 font-black uppercase text-xs h-12"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Create Order & Collect Payment"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
