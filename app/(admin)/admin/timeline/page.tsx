"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingsTimeline } from "@/components/admin/bookings/BookingsTimeline";
import { getTimelineBookings } from "@/app/(admin)/admin/bookings/actions";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TimelinePage() {
  const [timelineDate, setTimelineDate] = useState(new Date());
  const [timelineBookings, setTimelineBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimelineBookings();
  }, [timelineDate]);

  const loadTimelineBookings = async () => {
    setLoading(true);
    const dateStr = timelineDate.toISOString().split('T')[0];
    const result = await getTimelineBookings(dateStr);
    if (result.success) {
      setTimelineBookings(result.bookings);
    } else {
      toast.error("Failed to load timeline", { description: result.error });
    }
    setLoading(false);
  };

  const goToPreviousDay = () => {
    const newDate = new Date(timelineDate);
    newDate.setDate(newDate.getDate() - 1);
    setTimelineDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(timelineDate);
    newDate.setDate(newDate.getDate() + 1);
    setTimelineDate(newDate);
  };

  const goToToday = () => {
    setTimelineDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = timelineDate.toDateString() === new Date().toDateString();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Bookings Timeline
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Visual timeline of all bookings</p>
        </div>
      </div>

      {/* Date Navigation */}
      <Card className="bg-[#121212] border-[#27272a] p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              onClick={goToPreviousDay}
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 h-9 px-3"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-white">
                {formatDate(timelineDate)}
              </span>
            </div>

            <Button
              onClick={goToNextDay}
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 h-9 px-3"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isToday && (
            <Button
              onClick={goToToday}
              size="sm"
              className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-9 px-4"
            >
              Today
            </Button>
          )}
        </div>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <BookingsTimeline
          bookings={timelineBookings}
          selectedDate={timelineDate}
          onDateChange={setTimelineDate}
        />
      )}
    </div>
  );
}
