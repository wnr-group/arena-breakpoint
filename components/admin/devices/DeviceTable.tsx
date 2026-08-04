"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2, ImageIcon } from "lucide-react";
import { StatusBadge } from "@/components/admin/devices/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeviceTableProps {
  devices: any[];
  onEdit: (device: any) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

export function DeviceTable({ devices, onEdit, onDelete, isPending }: DeviceTableProps) {
  return (
    <div className="border border-[#e4e4e7] rounded-xl bg-[var(--surface)] overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--background)] border-b border-[#e4e4e7]">
          <tr>
            <th className="py-4 px-6 text-[10px] text-[#52525b] font-semibold uppercase tracking-wider">Image</th>
            <th className="py-4 px-6 text-[10px] text-[#52525b] font-semibold uppercase tracking-wider">Station #</th>
            <th className="py-4 px-6 text-[10px] text-[#52525b] font-semibold uppercase tracking-wider">Type</th>
            <th className="py-4 px-6 text-[10px] text-[#52525b] font-semibold uppercase tracking-wider">Specs</th>
            <th className="py-4 px-6 text-[10px] text-[#52525b] font-semibold uppercase tracking-wider">Hourly Rate</th>
            <th className="py-4 px-6 text-[10px] text-[#52525b] font-semibold uppercase tracking-wider">Qty</th>
            <th className="py-4 px-6 text-[10px] text-[#52525b] font-semibold uppercase tracking-wider">Status</th>
            <th className="py-4 px-6 text-[10px] text-[#52525b] font-semibold uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#27272a]">
          {devices.map((device) => {
            const statusClean = String(device.status || "").toLowerCase().trim();
            const isAvailable = statusClean === "available";

            return (
              <tr key={device.id} className="group hover:bg-[var(--surface-hover)] transition-all duration-300">
                <td className="py-3 px-6">
                  <div className="h-10 w-14 bg-[var(--surface-hover)] border border-[#e4e4e7] rounded overflow-hidden flex items-center justify-center">
                    {device.image_url ? (
                      <img src={device.image_url} alt="Cover" className="w-full h-full object-cover p-1" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-zinc-700" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 font-bold text-primary transition-all duration-300">
                  {device.station_number}
                </td>
                <td className="py-4 px-6 text-[#52525b]">{device.device_type?.display_name || 'N/A'}</td>
                <td className="py-4 px-6 text-sm text-[#52525b] max-w-xs truncate">
                  {device.specs || <span className="text-muted-content italic text-xs">None listed</span>}
                </td>
                <td className="py-4 px-6 font-semibold text-primary">
                  ₹{device.device_type?.regular_hourly_rate ? Number(device.device_type.regular_hourly_rate).toLocaleString('en-IN') : "0"}/hr
                </td>

                <td className="py-4 px-6 font-medium text-[#52525b]">
                  <span className="text-xs text-data-placeholder">{device.device_type?.included_players || 1}p inc.</span>
                </td>

                <td className="py-4 px-6">
                  <StatusBadge status={device.status} />
                </td>
                <td className="py-4 px-6">
                  <div className="flex justify-end gap-2 opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(device)}
                      className="h-8 w-8 text-[#52525b] hover:text-[#111115]"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          className="h-8 w-8 text-[#52525b] hover:text-[#ef4444] hover:bg-red-500/10"
                        >
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red" />}
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent className="bg-[var(--surface)] border border-[#e4e4e7] text-[#111115]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">Remove Terminal Record?</AlertDialogTitle>
                          <AlertDialogDescription className="text-[#52525b] text-sm">
                            Are you sure you want to delete **Station {device.station_number}**? This action will remove the hardware machine data completely from your system inventory.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                          <AlertDialogCancel className="bg-[#e4e4e7] text-[#111115] border-[#e4e4e7] hover:bg-[#e4e4e7] hover:text-[#111115]">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(device.id)}
                            className="bg-gradient-primary text-[var(--button-text)] font-semibold"
                          >
                            Confirm Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}