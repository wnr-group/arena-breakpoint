"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { getBookingDetails, checkInBooking, checkOutBooking, cancelBooking, addFoodToBooking, updatePlayerCount } from "@/app/(admin)/admin/bookings/actions";
import { getMenuItems } from "@/app/(admin)/admin/food/actions";
import { QRCodeSVG } from "qrcode.react";
import {
  User, Phone, Mail, Calendar, Clock, DollarSign,
  Loader2, CheckCircle2, XCircle, LogIn, LogOut,
  UtensilsCrossed, QrCode, MapPin, Gamepad2, Plus, Minus
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BookingDetailModalProps {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  openFoodModalDirectly?: boolean;
}

export function BookingDetailModal({ bookingId, open, onClose, onUpdate, openFoodModalDirectly }: BookingDetailModalProps) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [addFoodModalOpen, setAddFoodModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedFoodItems, setSelectedFoodItems] = useState<Record<string, number>>({});
  const [updatingPlayerCount, setUpdatingPlayerCount] = useState(false);

  useEffect(() => {
    if (open && bookingId) {
      loadBookingDetails();
      loadMenuItems();
      if (openFoodModalDirectly) {
        setAddFoodModalOpen(true);
      }
    }
  }, [open, bookingId, openFoodModalDirectly]);

  const loadBookingDetails = async () => {
    if (!bookingId) return;
    setLoading(true);
    const result = await getBookingDetails(bookingId);
    if (result.success) {
      setBooking(result.booking);
    } else {
      toast.error("Failed to load booking details", { description: result.error });
    }
    setLoading(false);
  };

  const loadMenuItems = async () => {
    const result = await getMenuItems();
    if (result.success) {
      // Filter only available items
      const availableItems = result.menuItems.filter((item: any) => item.status === "available");
      setMenuItems(availableItems);
    }
  };

  const handleAddFoodItems = async () => {
    if (!bookingId || Object.keys(selectedFoodItems).length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    setActionLoading(true);

    const items = Object.entries(selectedFoodItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => {
        const menuItem = menuItems.find((item) => item.id === itemId);
        return {
          menuItemId: itemId,
          itemName: menuItem.name,
          itemCategory: menuItem.category,
          quantity,
          unitPrice: Number(menuItem.price)
        };
      });

    const result = await addFoodToBooking(bookingId, items);

    if (result.success) {
      toast.success("Food items added successfully!");
      setSelectedFoodItems({});
      setAddFoodModalOpen(false);
      if (openFoodModalDirectly) {
        onClose();
      } else {
        loadBookingDetails();
        onUpdate?.();
      }
    } else {
      toast.error("Failed to add food items", { description: result.error });
    }

    setActionLoading(false);
  };

  const handleCheckIn = async () => {
    if (!bookingId) return;
    setActionLoading(true);
    const result = await checkInBooking(bookingId);
    if (result.success) {
      toast.success("Customer checked in successfully!");
      loadBookingDetails();
      onUpdate?.();
    } else {
      toast.error("Check-in failed", { description: result.error });
    }
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    if (!bookingId) return;
    setActionLoading(true);
    const result = await checkOutBooking(bookingId);
    if (result.success) {
      toast.success("Customer checked out successfully!");
      loadBookingDetails();
      onUpdate?.();
    } else {
      toast.error("Check-out failed", { description: result.error });
    }
    setActionLoading(false);
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    setActionLoading(true);
    const result = await cancelBooking(bookingId);
    if (result.success) {
      toast.success("Booking cancelled successfully");
      setCancelDialogOpen(false);
      loadBookingDetails();
      onUpdate?.();
    } else {
      toast.error("Cancellation failed", { description: result.error });
    }
    setActionLoading(false);
  };

  const handleUpdatePlayerCount = async (slotId: string, newCount: number, maxPlayers: number) => {
    setUpdatingPlayerCount(true);
    const result = await updatePlayerCount(slotId, newCount, maxPlayers);

    if (result.success) {
      toast.success(result.message, {
        description: `New total: ₹${result.newTotal?.toLocaleString('en-IN')}`
      });
      loadBookingDetails();
      onUpdate?.();
    } else {
      toast.error("Failed to update player count", { description: result.error });
    }

    setUpdatingPlayerCount(false);
  };

  const deviceSlot = booking?.booking_device_slots?.[0];

  return (
    <>
      <Dialog open={open && !openFoodModalDirectly} onOpenChange={onClose}>
        <DialogContent className="bg-[var(--surface)] border-[#27272a] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center justify-between">
              BOOKING DETAILS
              {booking && <BookingStatusBadge status={booking.status} size="lg" />}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : booking ? (
            <div className="space-y-6 mt-4">
              {/* QR Code and Booking Number */}
              <Card className="bg-[var(--background)] border-[#27272a] p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG value={booking.booking_number} size={140} level="H" />
                  </div>
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div>
                      <p className="text-label-enhanced mb-1">
                        Booking Number
                      </p>
                      <p className="text-3xl font-black text-primary font-mono tracking-wide">
                        {booking.booking_number}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm-enhanced">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-data-placeholder">Created: {new Date(booking.created_at).toLocaleString()}</span>
                      </div>
                      {booking.checked_in_at && (
                        <div className="flex items-center gap-1 text-green-500">
                          <LogIn className="h-3.5 w-3.5" />
                          <span>In: {new Date(booking.checked_in_at).toLocaleString()}</span>
                        </div>
                      )}
                      {booking.checked_out_at && (
                        <div className="flex items-center gap-1 text-blue-500">
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Out: {new Date(booking.checked_out_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card className="bg-[var(--background)] border-[#27272a] p-5 space-y-4">
                  <h3 className="text-section-header border-b border-[#27272a] pb-3 mb-2">
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-label-enhanced text-muted-content mb-1">Customer</p>
                        <p className="text-base font-bold text-white">{booking.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-label-enhanced text-muted-content mb-1">Phone</p>
                        <p className="text-base font-mono text-white font-semibold">{booking.customer_phone}</p>
                      </div>
                    </div>
                    {booking.customer_email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-label-enhanced text-muted-content mb-1">Email</p>
                          <p className="text-base text-white break-all font-semibold">{booking.customer_email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Device Slot Information */}
                <Card className="bg-[var(--background)] border-[#27272a] p-5 space-y-4">
                  <h3 className="text-section-header border-b border-[#27272a] pb-3 mb-2">
                    Device & Slot Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-label-enhanced text-muted-content mb-1">Device</p>
                        <p className="text-base font-bold text-white">
                          {deviceSlot?.device_type} #{deviceSlot?.device_station_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-label-enhanced text-muted-content mb-1">Date</p>
                        <p className="text-base text-white font-semibold">
                          {deviceSlot?.slot_date ? new Date(deviceSlot.slot_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-label-enhanced text-muted-content mb-1">Time Slot</p>
                        <p className="text-base text-white font-semibold">
                          {deviceSlot?.slot_start_time} - {deviceSlot?.slot_end_time}
                        </p>
                        <p className="text-sm-enhanced text-secondary-content mt-1">
                          Duration: {deviceSlot?.duration_hours}h
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Game Orders */}
              {booking.booking_device_slots && booking.booking_device_slots.length > 0 && (
                <Card className="bg-[var(--background)] border-[#27272a] p-5 space-y-4">
                  <h3 className="text-[10px] font-black text-secondary-content uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Game Orders
                  </h3>
                  <div className="space-y-3">
                    {booking.booking_device_slots.map((slot: any) => {
                      const currentPlayerCount = slot.player_count || slot.included_players || 1;
                      const includedPlayers = slot.included_players || 1;
                      const maxPlayers = slot.devices?.device_type?.max_players || 10;
                      const extraPlayers = Math.max(0, currentPlayerCount - includedPlayers);
                      const extraPlayersCharge = extraPlayers * (slot.extra_player_charge || 0);
                      const canEdit = booking.status !== "cancelled" && booking.status !== "completed";

                      return (
                        <div key={slot.id} className="bg-[var(--surface)] border border-[#27272a] rounded-lg p-4 space-y-3">
                          {/* Game/Device Info */}
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-black text-white">{slot.device_type}</p>
                              <p className="text-sm font-semibold text-secondary-content">
                                {slot.duration_hours}h × ₹{Number(slot.hourly_rate).toLocaleString('en-IN')}/hr
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-white">₹{Number(slot.slot_total).toLocaleString('en-IN')}</p>
                              <p className="text-[9px] text-data-placeholder uppercase">Base Rate</p>
                            </div>
                          </div>

                          {/* Player Count Control */}
                          <div className="pt-2 border-t border-[#27272a]/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-white uppercase">Player Count</p>
                                <p className="text-min-enhanced text-secondary-content">
                                  {includedPlayers} included • Max {maxPlayers}
                                </p>
                              </div>
                              {canEdit ? (
                                <div className="flex items-center gap-3">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdatePlayerCount(slot.id, currentPlayerCount - 1, maxPlayers)}
                                    disabled={updatingPlayerCount || currentPlayerCount <= 1}
                                    className="h-8 w-8 p-0 bg-primary hover:bg-primary-hover text-black disabled:opacity-30"
                                  >
                                    <Minus className="h-3 w-3 bg-primary hover:bg-primary-hover text-black font-black" />
                                  </Button>
                                  <span className="text-lg font-black text-white w-8 text-center">
                                    {currentPlayerCount}
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdatePlayerCount(slot.id, currentPlayerCount + 1, maxPlayers)}
                                    disabled={updatingPlayerCount || currentPlayerCount >= maxPlayers}
                                    className="h-8 w-8 p-0 bg-primary hover:bg-primary-hover text-black disabled:opacity-30"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-lg font-black text-white">{currentPlayerCount}</span>
                              )}
                            </div>

                            {/* Extra Players Charge */}
                            {extraPlayers > 0 && (
                              <div className="flex justify-between items-center pt-2 border-t border-[#27272a]/30">
                                <div>
                                  <p className="text-sm font-bold text-primary">Extra Players</p>
                                  <p className="text-sm text-secondary-content font-medium">
                                    {extraPlayers} player{extraPlayers > 1 ? 's' : ''} × ₹{Number(slot.extra_player_charge || 0).toLocaleString('en-IN')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-primary">₹{extraPlayersCharge.toLocaleString('en-IN')}</p>
                                  <p className="text-[9px] text-muted-content uppercase">Additional</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Food Items */}
              <Card className="bg-[var(--background)] border-[#27272a] p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#27272a] pb-3 mb-2">
                  <h3 className="text-section-header flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    Food & Beverage Orders
                  </h3>
                  {booking.status !== "cancelled" && booking.status !== "completed" && (
                    <Button
                      onClick={() => setAddFoodModalOpen(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-9 px-4"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Food
                    </Button>
                  )}
                </div>
                {booking.booking_food_items && booking.booking_food_items.length > 0 ? (
                  <div className="space-y-3">
                    {booking.booking_food_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-[var(--surface)] border border-[#27272a] rounded-lg hover:border-primary/30 transition-colors">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-white mb-1">{item.item_name}</p>
                          <p className="text-sm-enhanced text-secondary-content">Qty: <span className="font-bold">{item.quantity}</span> × ₹{Number(item.unit_price).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-primary">₹{Number(item.line_total).toLocaleString('en-IN')}</p>
                          <p className="text-min text-muted-content uppercase mt-1">{item.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm-enhanced text-center py-6">No food items ordered yet</p>
                )}
              </Card>

              {/* Payment Summary - Detailed Breakdown */}
              <Card className="bg-gradient-to-br from-[#0a0a0a] via-zinc-950 to-[#0a0a0a] border-2 border-primary/30 p-6 shadow-[0_0_30px_rgba(184,134,11,0.2)]">
                <h3 className="text-section-header text-primary mb-5 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Summary
                </h3>
                <div className="space-y-4 text-base">
                  {(() => {
                    // Calculate device charges with duration
                    const deviceSlot = booking.booking_device_slots?.[0];
                    const durationHours = deviceSlot?.duration_hours || 1;
                    const hourlyRate = deviceSlot?.hourly_rate || 0;
                    const deviceCharges = hourlyRate * durationHours;

                    // Calculate extra player charges
                    const extraPlayersTotal = booking.booking_device_slots?.reduce(
                      (sum: number, slot: any) => sum + (Number(slot.extra_players_total) || 0),
                      0
                    ) || 0;

                    // Calculate subtotal
                    const calculatedSubtotal = Number(booking.device_subtotal) + Number(booking.food_subtotal);

                    // Calculate total
                    const calculatedTotal = calculatedSubtotal -
                      Number(booking.subscription_discount || 0) -
                      Number(booking.promo_discount || 0);

                    return (
                      <>
                        <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                          <span className="text-secondary-content font-semibold text-base">
                            Device Booking ({durationHours}h × ₹{hourlyRate}):
                          </span>
                          <span className="text-white font-bold text-lg">₹{deviceCharges.toFixed(2)}</span>
                        </div>

                        {extraPlayersTotal > 0 && (
                          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                            <span className="text-secondary-content font-semibold text-base">Extra Players:</span>
                            <span className="text-white font-bold text-lg">₹{extraPlayersTotal.toFixed(2)}</span>
                          </div>
                        )}

                        {booking.food_subtotal > 0 && (
                          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                            <span className="text-secondary-content font-semibold text-base">Food & Beverages:</span>
                            <span className="text-white font-bold text-lg">₹{Number(booking.food_subtotal).toFixed(2)}</span>
                          </div>
                        )}

                        {booking.booking_food_items && booking.booking_food_items.length > 0 && (
                          <div className="ml-4 space-y-2 py-3 border-b border-zinc-800">
                            {booking.booking_food_items.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-secondary-content font-medium">
                                  {item.item_name} x{item.quantity}
                                </span>
                                <span className="text-muted-content font-semibold">₹{item.line_total}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between py-3 border-b-2 border-zinc-700">
                          <span className="text-white font-bold text-lg">Subtotal:</span>
                          <span className="text-white font-black text-xl">₹{calculatedSubtotal.toFixed(2)}</span>
                        </div>

                        {booking.subscription_discount > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-zinc-800 text-green-500">
                            <span className="font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Subscription Discount:
                            </span>
                            <span className="font-bold">-₹{Number(booking.subscription_discount).toFixed(2)}</span>
                          </div>
                        )}

                        {booking.promo_discount > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-zinc-800 text-primary">
                            <span className="font-medium">Promo Discount:</span>
                            <span className="font-bold">-₹{Number(booking.promo_discount).toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-5 border-t-2 border-primary/20">
                          <span className="text-white font-black text-xl uppercase">Total Amount:</span>
                          <span className="text-3xl font-black bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
                            ₹{calculatedTotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-3">
                          <span className="text-secondary-content uppercase font-bold">Payment Status</span>
                          <span className={`font-black uppercase px-3 py-1 rounded-full ${
                            booking.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                              : booking.payment_status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-zinc-800 text-secondary-content border border-zinc-700'
                          }`}>
                            {booking.payment_status}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-6 border-t-2 border-[#27272a]">
                {booking.status === "confirmed" && (
                  <Button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-sm h-12 px-8 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                    Check In Customer
                  </Button>
                )}

                {booking.status === "checked_in" && (
                  <Button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-sm h-12 px-8 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                    Check Out Customer
                  </Button>
                )}

                {(booking.status === "confirmed" || booking.status === "checked_in") && (
                  <Button
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={actionLoading}
                    variant="outline"
                    className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 font-black uppercase text-sm h-12 px-8 flex items-center gap-2"
                  >
                    <XCircle className="h-5 w-5" />
                    Cancel Booking
                  </Button>
                )}

                <Button
                  onClick={onClose}
                  className="ml-auto bg-primary hover:bg-primary-hover text-black font-black uppercase text-sm h-12 px-8"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-muted-content">No booking data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Food Modal */}
      <Dialog open={addFoodModalOpen} onOpenChange={(val) => {
        setAddFoodModalOpen(val);
        if (!val) {
          setSelectedFoodItems({});
          if (openFoodModalDirectly) {
            onClose();
          }
        }
      }}>
        <DialogContent className="bg-[var(--surface)] border-[#27272a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Add Food & Beverages
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {["Snacks", "Drinks", "Meals"].map((category) => {
              const categoryItems = menuItems.filter((item) => item.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h4 className="text-label-enhanced border-b border-[#27272a] pb-2">
                    {category}
                  </h4>
                  <div className="space-y-3">
                    {categoryItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-[var(--background)] border border-[#27272a] rounded-lg hover:border-primary/30 transition-colors">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-white">{item.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm-enhanced text-primary font-bold">₹{Number(item.price).toLocaleString('en-IN')}</p>
                            <span className="text-xs text-muted-content">
                              • Stock: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const qty = (selectedFoodItems[item.id] || 0);
                              if (qty > 0) {
                                setSelectedFoodItems({ ...selectedFoodItems, [item.id]: qty - 1 });
                              }
                            }}
                            disabled={(selectedFoodItems[item.id] || 0) === 0}
                            className="h-10 w-10 p-0 bg-primary hover:bg-primary-hover text-black"
                          >
                            <Minus className="h-4 w-4 " />
                          </Button>
                          <span className="text-lg font-black text-white w-10 text-center">
                            {selectedFoodItems[item.id] || 0}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => {
                              const qty = (selectedFoodItems[item.id] || 0);
                              // Check stock availability
                              if (qty >= item.quantity) {
                                toast.error(`Only ${item.quantity} ${item.name} available in stock`);
                                return;
                              }
                              setSelectedFoodItems({ ...selectedFoodItems, [item.id]: qty + 1 });
                            }}
                            disabled={(selectedFoodItems[item.id] || 0) >= item.quantity}
                            className="h-10 w-10 p-0 bg-primary hover:bg-primary-hover text-black disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {menuItems.length === 0 && (
              <p className="text-center text-muted-content py-8">No menu items available</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#27272a] mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setAddFoodModalOpen(false);
                setSelectedFoodItems({});
                if (openFoodModalDirectly) {
                  onClose();
                }
              }}
              className="border-[#27272a] text-muted-content hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFoodItems}
              disabled={actionLoading || Object.values(selectedFoodItems).every((qty) => qty === 0)}
              className="bg-primary hover:bg-primary-hover text-black font-black uppercase"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Items
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-[var(--surface)] border-[#27272a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-content">
              Are you sure you want to cancel booking <span className="text-primary font-mono">{booking?.booking_number}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#27272a] text-white border-zinc-700 hover:bg-zinc-800">
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
