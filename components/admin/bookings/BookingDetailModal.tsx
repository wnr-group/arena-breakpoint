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
import { getBookingDetails, checkInBooking, checkOutBooking, cancelBooking } from "@/app/(admin)/admin/bookings/actions";
import { QRCodeSVG } from "qrcode.react";
import {
  User, Phone, Mail, Calendar, Clock, DollarSign,
  Loader2, CheckCircle2, XCircle, LogIn, LogOut,
  UtensilsCrossed, QrCode, MapPin
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
}

export function BookingDetailModal({ bookingId, open, onClose, onUpdate }: BookingDetailModalProps) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (open && bookingId) {
      loadBookingDetails();
    }
  }, [open, bookingId]);

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

  const deviceSlot = booking?.booking_device_slots?.[0];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-[#121212] border-[#27272a] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <Card className="bg-[#0a0a0a] border-[#27272a] p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG value={booking.booking_number} size={140} level="H" />
                  </div>
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div>
                      <p className="text-[10px] text-zinc-600 font-black uppercase tracking-wider mb-1">
                        Booking Number
                      </p>
                      <p className="text-2xl font-black text-primary font-mono tracking-wide">
                        {booking.booking_number}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Created: {new Date(booking.created_at).toLocaleString()}</span>
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
                <Card className="bg-[#0a0a0a] border-[#27272a] p-5 space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider border-b border-[#27272a] pb-2">
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-600 uppercase">Name</p>
                        <p className="text-sm font-bold text-white">{booking.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-600 uppercase">Phone</p>
                        <p className="text-sm font-mono text-white">{booking.customer_phone}</p>
                      </div>
                    </div>
                    {booking.customer_email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[10px] text-zinc-600 uppercase">Email</p>
                          <p className="text-sm text-white break-all">{booking.customer_email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Device Slot Information */}
                <Card className="bg-[#0a0a0a] border-[#27272a] p-5 space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider border-b border-[#27272a] pb-2">
                    Device & Slot Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-600 uppercase">Device</p>
                        <p className="text-sm font-bold text-white">
                          {deviceSlot?.device_type} #{deviceSlot?.device_station_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-600 uppercase">Date</p>
                        <p className="text-sm text-white">
                          {deviceSlot?.slot_date ? new Date(deviceSlot.slot_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-600 uppercase">Time Slot</p>
                        <p className="text-sm text-white">
                          {deviceSlot?.slot_start_time} - {deviceSlot?.slot_end_time}
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          Duration: {deviceSlot?.duration_hours}h
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Food Items */}
              {booking.booking_food_items && booking.booking_food_items.length > 0 && (
                <Card className="bg-[#0a0a0a] border-[#27272a] p-5 space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Food & Beverage Orders
                  </h3>
                  <div className="space-y-2">
                    {booking.booking_food_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-[#121212] border border-[#27272a] rounded-lg">
                        <div>
                          <p className="text-sm font-bold text-white">{item.item_name}</p>
                          <p className="text-xs text-zinc-600">Qty: {item.quantity} × ₹{Number(item.unit_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">₹{Number(item.line_total).toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-zinc-600 uppercase">{item.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Payment Summary */}
              <Card className="bg-[#0a0a0a] border-[#27272a] p-5 space-y-4">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider border-b border-[#27272a] pb-2">
                  Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Device Booking</span>
                    <span className="text-white font-bold">₹{Number(booking.device_subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  {booking.food_subtotal > 0 && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Food & Beverages</span>
                      <span className="text-white font-bold">₹{Number(booking.food_subtotal).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-white pt-2 border-t border-[#27272a] text-lg">
                    <span>TOTAL AMOUNT</span>
                    <span className="text-primary">₹{Number(booking.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>Payment Status</span>
                    <span className={booking.payment_status === 'paid' ? 'text-green-500' : 'text-amber-500'}>
                      {booking.payment_status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-[#27272a]">
                {booking.status === "confirmed" && (
                  <Button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs h-11 px-6 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Check In Customer
                  </Button>
                )}

                {booking.status === "checked_in" && (
                  <Button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs h-11 px-6 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Check Out Customer
                  </Button>
                )}

                {(booking.status === "confirmed" || booking.status === "checked_in") && (
                  <Button
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={actionLoading}
                    variant="destructive"
                    className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 font-black uppercase text-xs h-11 px-6 flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Booking
                  </Button>
                )}

                <Button
                  onClick={onClose}
                  variant="outline"
                  className="ml-auto border-[#27272a] text-zinc-400 hover:text-white font-bold uppercase text-xs h-11 px-6"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-zinc-600">No booking data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-[#121212] border-[#27272a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
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
