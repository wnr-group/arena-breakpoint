"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gamepad2, MapPin, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface AvailableDevicesModalProps {
  open: boolean;
  onClose: () => void;
  devices: any[];
}

export function AvailableDevicesModal({ open, onClose, devices }: AvailableDevicesModalProps) {
  const router = useRouter();
  const availableDevices = devices.filter(d => d.is_available);
  const unavailableDevices = devices.filter(d => !d.is_available);

  const deviceTypes = [...new Set(availableDevices.map(d => d.device_type))];

  const handleViewAllDevices = () => {
    router.push('/admin/devices');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--background)] border-primary/30 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-amber-500" />
              Device Availability
            </div>
            <Button
              onClick={handleViewAllDevices}
              size="sm"
              variant="ghost"
              className="text-xs text-primary hover:text-primary-hover"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Manage Devices
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400 mb-1">Available</p>
            <p className="text-2xl font-black text-white">{availableDevices.length}</p>
            <p className="text-label mt-1">Ready to use</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 mb-1">In Use</p>
            <p className="text-2xl font-black text-white">{unavailableDevices.length}</p>
            <p className="text-label mt-1">Currently booked</p>
          </div>
        </div>

        {/* Device Types Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase text-muted-content">Available by Type</h4>
          <div className="grid grid-cols-2 gap-2">
            {deviceTypes.map(type => {
              const count = availableDevices.filter(d => d.device_type === type).length;
              return (
                <div key={type} className="p-3 bg-[var(--surface)] border border-[#27272a] rounded-lg">
                  <p className="text-xs text-muted-content">{type}</p>
                  <p className="text-lg font-black text-white">{count} Available</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Devices List */}
        <div className="space-y-3">
          <h4 className="text-sm font-black uppercase text-green-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Available Now
          </h4>
          {availableDevices.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {availableDevices.map((device) => (
                <div
                  key={device.id}
                  className="p-3 bg-[var(--surface)] border border-green-500/30 rounded-lg hover:border-green-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-green-500" />
                    <p className="text-xs font-bold text-white">{device.device_type}</p>
                  </div>
                  <p className="text-label">Station #{device.station_number}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <p className="text-[9px] text-green-500 font-bold uppercase">Ready</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-[var(--surface)] border border-[#27272a] rounded-lg">
              <p className="text-xs text-muted-content">No devices available</p>
            </div>
          )}
        </div>

        {/* In Use Devices */}
        {unavailableDevices.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              In Use
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {unavailableDevices.map((device) => (
                <div
                  key={device.id}
                  className="p-3 bg-[var(--surface)] border border-red-500/30 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs font-bold text-white">{device.device_type}</p>
                  </div>
                  <p className="text-label">Station #{device.station_number}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <p className="text-[9px] text-red-500 font-bold uppercase">Occupied</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
