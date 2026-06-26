"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Gamepad2, ImageIcon, Loader2, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import { updateDevice } from "@/app/(admin)/admin/devices/actions";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface EditModalProps {
  device: any;
  onFormSuccess: () => void;
  onClose: () => void;
}

export function EditDeviceModal({ device, onFormSuccess, onClose }: EditModalProps) {
  const [isPending, startTransition] = useTransition();

  // --- ACTIVE MODAL OBSERVER VALUE STATES ---
  const [editType, setEditType] = useState(device.type || "PlayStation 5");
  const [editStation, setEditStation] = useState(device.station_number || "");
  const [editStatus, setEditStatus] = useState(device.status || "available");
  const [hourlyRate, setHourlyRate] = useState(device.device_type?.regular_hourly_rate || "");
  const [localFile, setLocalFile] = useState<File | null>(null);

  // Computes fallback path variables between historical bucket signatures or newly staged files
  const filePreviewUrl = useMemo(() => {
    if (localFile) return URL.createObjectURL(localFile);
    return device.image_url || null;
  }, [localFile, device.image_url]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetForm = e.currentTarget;

    startTransition(async () => {
      let finalImageUrl = device.image_url || "";

      // Check if a new file asset is uploaded to overwrite the historical one
      if (localFile) {
        const fileExt = localFile.name.split('.').pop();
        const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('device-images')
          .upload(uniqueFileName, localFile);

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('device-images')
            .getPublicUrl(uniqueFileName);
          finalImageUrl = publicData.publicUrl;
        }
      }

      const submissionFormData = new FormData(targetForm);
      submissionFormData.set('id', device.id);
      submissionFormData.set('image_url', finalImageUrl);
      submissionFormData.set('status', editStatus);

      const result = await updateDevice(submissionFormData);
      if (result.success) {
        toast.success("Configuration Updated", {
          description: `Station ${editStation} overrides applied successfully.`,
          icon: <CheckCircle2 className="h-5 w-5 text-primary" />
        });
        onFormSuccess();
      } else {
        toast.error("Update Failed", {
          description: result.error,
          icon: <AlertCircle className="h-5 w-5 text-[#f43f5e]" />
        });
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[var(--background)] border-[#27272a] text-white max-w-[900px] w-[95vw] p-0 overflow-hidden shadow-2xl h-auto max-h-[90vh] flex flex-col justify-between">

        {/* Header Panel */}
        <div className="p-6 border-b border-[#27272a]/70 bg-[var(--surface)] flex-shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight text-white">Edit Device Configuration</DialogTitle>
          <p className="text-xs text-[#a1a1aa] mt-1">Modify real-time arena metrics and track design layout card alterations instantly</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">

          {/* Left Panel: Grid Input Layout Container */}
          <div className="flex-1 p-8 space-y-6 bg-[var(--background)] overflow-y-auto">

            {/* Form row block 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Platform Type</label>
                <select
                  name="device_type_id"
                  defaultValue={device.device_type_id}
                  required
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[var(--surface)] px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-white cursor-pointer transition-colors"
                >
                  <option value={device.device_type_id}>{device.device_type?.display_name || "Current Type"}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Station ID</label>
                <Input
                  name="station_number"
                  value={editStation}
                  onChange={(e) => setEditStation(e.target.value)}
                  className="h-10 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            {/* Form row block 2 */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Hourly Rate</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-[#a1a1aa] text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="hourly_rate"
                  placeholder="0"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[var(--surface)] pl-7 pr-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                  required
                />
              </div>
            </div>

            {/*  Replaced simple input line with modern  field component */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Hardware Visual Image</label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-[#27272a] border-dashed rounded-xl cursor-pointer bg-[var(--surface)] hover:bg-[#161616] hover:border-primary/40 transition-all group">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-[#a1a1aa] font-medium max-w-[280px] truncate">
                    {localFile ? localFile.name : "Choose a file to update existing image path"}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLocalFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Upgraded layout status into a clean grid  */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Device Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['available', 'maintenance', 'occupied', 'inactive'].map((status) => (
                  <label key={status} className={`flex items-center justify-center cursor-pointer rounded-lg border py-2.5 text-xs font-bold transition-all ${editStatus === status ? 'border-primary bg-primary/10 text-primary' : 'border-[#27272a] bg-[var(--surface)] text-[#a1a1aa] hover:border-zinc-700'}`}>
                    <input type="radio" name="status_radio" value={status} className="hidden" checked={editStatus === status} onChange={() => setEditStatus(status)} />
                    <span className="capitalize tracking-wide">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Description</label>
              <textarea name="specs" defaultValue={device.specs} placeholder="GPU parameters, hardware configurations..." className="w-full rounded-md border border-[#27272a] bg-[var(--surface)] px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary h-24 outline-none resize-none transition-colors" />
            </div>
          </div>

          <div className="w-full md:w-[350px] bg-[var(--surface)] border-l border-[#27272a]/70 p-8 flex flex-col justify-between items-center flex-shrink-0">
            <div className="w-full flex-1 flex flex-col justify-center">
              <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-4 text-center">Adjusted Display Preview</p>

              <Card className="bg-[var(--background)] border-[#27272a] overflow-hidden w-full max-w-[250px] mx-auto shadow-2xl">
                <div className="h-32 w-full bg-[var(--background)] border-b border-[#27272a] flex items-center justify-center overflow-hidden relative">
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Real-time layout sync" className="w-full h-full object-cover animate-in fade-in duration-300" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-700 gap-1.5">
                      <ImageIcon className="h-5 w-5 text-zinc-600" />
                      <span className="text-[10px]">No image mapped</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-1.5 bg-[var(--surface-hover)] rounded-md border border-zinc-800"><Gamepad2 className="h-4 w-4 text-primary" /></div>
                    <EditPreviewBadge previewStatus={editStatus} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight uppercase">{editStation || "STATION-ID"}</h3>
                    <p className="text-[#a1a1aa] text-[11px] flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span>{editType}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 text-xs">
                    <span className="text-[#a1a1aa] font-medium">Rate / Hour</span>
                    <span className="font-bold text-primary text-sm">₹{hourlyRate || "0"}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom Footer Control Row */}
            <div className="w-full flex justify-end gap-3 mt-6 pt-4 border-t border-[#27272a]/40 flex-shrink-0">
              <Button type="button" variant="ghost" className="text-[#a1a1aa] hover:bg-zinc-900 hover:text-white" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-bold px-6 h-10 text-sm rounded-md shadow-md transition-all">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Overrides"}
              </Button>
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPreviewBadge({ previewStatus }: { previewStatus: string }) {
  if (previewStatus === 'available') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/30 rounded uppercase bg-primary/5">Available</span>;
  if (previewStatus === 'maintenance') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">Maintenance</span>;
  if (previewStatus === 'inactive') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">Inactive</span>;
  return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#a1a1aa] border border-[#27272a] rounded uppercase bg-[var(--surface)]">Occupied</span>;
}