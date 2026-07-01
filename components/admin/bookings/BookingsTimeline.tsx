"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge } from "./BookingStatusBadge";

interface TimelineBooking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  device_type: string;
  device_station_number: string;
  device_id: string;
  slot_start_time: string; // "10:00:00"
  slot_end_time: string; // "12:00:00"
  status: string;
  total_amount: number;
}

interface BookingsTimelineProps {
  bookings: TimelineBooking[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onBookingClick: (booking: any) => void;
}

export function BookingsTimeline({ bookings, selectedDate, onDateChange, onBookingClick }: BookingsTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Generate 48 time slots (24 hours × 2 for 30-min intervals)
  const timeSlots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  // Convert time to 12-hour format for display
  const formatTime12h = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Convert time to minutes since midnight
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculate position and width for booking block
  const getBookingPosition = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Handle overnight bookings
    const duration = endMinutes < startMinutes
      ? (24 * 60 - startMinutes) + endMinutes
      : endMinutes - startMinutes;

    // Each slot is 30 minutes, timeline is 48 slots wide
    const slotWidth = 100 / 48; // percentage
    const left = (startMinutes / 30) * slotWidth;
    const width = (duration / 30) * slotWidth;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Group bookings by device
  const deviceGroups = bookings.reduce((groups, booking) => {
    const key = `${booking.device_type} #${booking.device_station_number}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(booking);
    return groups;
  }, {} as Record<string, TimelineBooking[]>);

  const deviceKeys = Object.keys(deviceGroups).sort();

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    if (!isToday) return null;

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const slotWidth = 100 / 48;
    const position = (minutes / 30) * slotWidth;
    return `${position}%`;
  };

  const currentTimePosition = getCurrentTimePosition();

  // Scroll to current time on mount (if today)
  useEffect(() => {
    if (currentTimePosition && scrollRef.current) {
      const scrollPosition = (parseFloat(currentTimePosition) / 100) * scrollRef.current.scrollWidth;
      scrollRef.current.scrollLeft = scrollPosition - scrollRef.current.clientWidth / 2;
    }
  }, [currentTimePosition, selectedDate]);

  return (
    <Card className="bg-gradient-to-br from-[var(--background)] via-[var(--surface)] to-[var(--background)] border-2 border-primary/30 overflow-hidden glow-box-strong relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer pointer-events-none" />

      {/* Header */}
      <div className="p-4 border-b border-primary/20 flex items-center justify-between relative z-10">
        <h3 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary rounded-full" />
          Timeline View
        </h3>
        <div className="text-xs text-secondary-content">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''} on this day
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Time header */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950"
        >
          <div className="min-w-max">
            {/* Hour labels */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-[var(--background)] to-[var(--surface)] border-b border-primary/20 flex">
              <div className="w-40 flex-shrink-0 border-r border-primary/20 p-3">
                <span className="text-[10px] font-black text-primary uppercase">Device</span>
              </div>
              <div className="flex flex-1" style={{ minWidth: '2400px' }}>
                {timeSlots.map((time, index) => {
                  const isHourStart = time.endsWith(':00');
                  return (
                    <div
                      key={time}
                      className={`flex-1 border-r border-zinc-800/50 p-2 ${isHourStart ? 'bg-primary/5' : 'bg-transparent'}`}
                    >
                      {isHourStart && (
                        <div className="text-[9px] font-black text-muted-content uppercase">
                          {formatTime12h(time)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Device rows */}
            {deviceKeys.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-muted-content font-bold">No bookings for this date</p>
                <p className="text-xs text-zinc-700 mt-1">Try selecting a different date</p>
              </div>
            ) : (
              deviceKeys.map((deviceKey) => (
                <div key={deviceKey} className="flex border-b border-zinc-800/50 hover:bg-primary/5 transition-colors relative group">
                  {/* Device label */}
                  <div className="w-40 flex-shrink-0 border-r border-zinc-800/50 p-3 flex items-center sticky left-0 bg-gradient-to-r from-[var(--background)] to-[var(--surface)] z-10 group-hover:from-primary/10 group-hover:to-primary/5">
                    <div>
                      <p className="text-xs font-black text-white">{deviceKey.split(' #')[0]}</p>
                      <p className="text-label">Station #{deviceKey.split('#')[1]}</p>
                    </div>
                  </div>

                  {/* Timeline grid */}
                  <div className="flex-1 relative" style={{ minWidth: '2400px', height: '80px' }}>
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {timeSlots.map((time) => (
                        <div key={time} className="flex-1 border-r border-[#27272a]/30" />
                      ))}
                    </div>

                    {/* Current time indicator */}
                    {currentTimePosition && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                        style={{ left: currentTimePosition }}
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    )}

                    {/* Bookings */}
                    {deviceGroups[deviceKey].map((booking) => {
                      const position = getBookingPosition(booking.slot_start_time, booking.slot_end_time);
                      const statusColors = {
                        confirmed: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
                        checked_in: 'bg-green-500/20 border-green-500/50 text-green-300',
                        completed: 'bg-zinc-700/20 border-zinc-600/50 text-muted-content',
                        cancelled: 'bg-red-500/20 border-red-500/50 text-red-400',
                        locked: 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      };
                      const colorClass = statusColors[booking.status as keyof typeof statusColors] || statusColors.confirmed;

                      return (
                        <div
                          key={booking.id}
                          className={`absolute top-2 bottom-2 ${colorClass} border rounded-lg p-2 cursor-pointer hover:scale-[1.02] transition-all z-10 overflow-hidden shadow-lg`}
                          style={position}
                          onClick={() => onBookingClick(booking)}
                        >
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase truncate">{booking.customer_name}</p>
                              <p className="text-[8px] opacity-80 truncate">{booking.device_type} #{booking.device_station_number}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold">
                                {formatTime12h(booking.slot_start_time.substring(0, 5))}
                              </span>
                              <span className="text-[8px] opacity-60">₹{booking.total_amount}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-[#27272a] flex items-center gap-4 bg-[var(--background)]">
        <span className="text-[10px] font-black text-secondary-content uppercase">Status:</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/50" />
            <span className="text-[10px] text-muted-content">Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
            <span className="text-[10px] text-muted-content">Checked In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-zinc-700/20 border border-zinc-600/50" />
            <span className="text-[10px] text-muted-content">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50" />
            <span className="text-[10px] text-muted-content">Cancelled</span>
          </div>
          {currentTimePosition && (
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-0.5 h-3 bg-red-500" />
              <span className="text-[10px] text-red-400 font-bold">Current Time</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
