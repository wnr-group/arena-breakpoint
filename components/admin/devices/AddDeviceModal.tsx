"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { PlusCircle, UploadCloud, Gamepad2, ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createDevice } from "@/app/(admin)/admin/devices/actions";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AddModalProps {
  onFormSuccess: () => Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function AddDeviceModal({ onFormSuccess, open, setOpen }: AddModalProps) {
  const [isPending, startTransition] = useTransition();

  const [previewType, setPreviewType] = useState("PlayStation 5");
  const [previewStation, setPreviewStation] = useState("");
  const [previewStatus, setPreviewStatus] = useState("available");
  const [hourlyRate, setHourlyRate] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [localFile, setLocalFile] = useState<File | null>(null);

  const filePreviewUrl = useMemo(() => {
    if (!localFile) return null;
    return URL.createObjectURL(localFile);
  }, [localFile]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetForm = e.currentTarget;

    startTransition(async () => {
      let bucketUrl = "";

      if (localFile) {
        const fileExt = localFile.name.split('.').pop();
        const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('device-images')
          .upload(uniqueFileName, localFile);

        if (uploadError) {
          toast.error("Bucket upload error: " + uploadError.message);
          return;
        }

        const { data: publicData } = supabase.storage
          .from('device-images')
          .getPublicUrl(uniqueFileName);

        bucketUrl = publicData.publicUrl;
      }

      const submissionFormData = new FormData(targetForm);
      if (bucketUrl) {
        submissionFormData.set('image_url', bucketUrl);
      }

      const result = await createDevice(submissionFormData);
      if (result.success) {
        setOpen(false);
        setLocalFile(null);
        setPreviewStation("");
        setHourlyRate("");
        setQuantity("1");

        toast.success("New Machine Registered", {
          description: `Station ${previewStation || "Asset"} added successfully.`,
          icon: <CheckCircle2 className="h-5 w-5 text-[#FFC107]" />
        });

        await onFormSuccess();
      } else {
        toast.error("Registration Failed", {
          description: result.error,
          icon: <AlertCircle className="h-5 w-5 text-[#f43f5e]" />
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-semibold rounded-md px-6 transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(255,193,7,0.15)]">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Device
        </Button>
      </DialogTrigger>

      {/* 💡 FIX: Set h-auto and max-h-[90vh] with dynamic overflow on content container to remove forced squeezing */}
      <DialogContent className="bg-[#0a0a0a] border-[#27272a] text-white max-w-[900px] w-[95vw] p-0 overflow-hidden shadow-2xl h-auto max-h-[90vh] flex flex-col justify-between">
        
        {/* Header Panel */}
        <div className="p-6 border-b border-[#27272a]/70 bg-[#121212] flex-shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight text-white">Add New Device</DialogTitle>
          <p className="text-xs text-[#a1a1aa] mt-1">Configure asset specifications and check real-time layout display metrics</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">
          
          {/* Left Form Panel */}
          <div className="flex-1 p-8 space-y-6 bg-[#0a0a0a] overflow-y-auto">
            
            {/* Input Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Device Type</label>
                <select
                  name="type"
                  value={previewType}
                  onChange={(e) => setPreviewType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm focus:border-[#FFC107] focus:ring-1 focus:ring-[#FFC107] outline-none text-white cursor-pointer transition-colors"
                >
                  <option value="PS5">PS 5</option>
                  <option value="Standard Snooker">Standard Snooker</option>
                  <option value="Medium Snooker">Medium Snooker</option>
                  <option value="American Snooker">American Snooker</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Station #</label>
                <Input
                  name="station_number"
                  placeholder="e.g. S-03"
                  className="h-10 bg-[#121212] border-[#27272a] text-sm text-white focus-visible:ring-[#FFC107] focus-visible:border-[#FFC107] transition-colors"
                  value={previewStation}
                  onChange={(e) => setPreviewStation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] pl-7 pr-3 text-sm focus:ring-1 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Available Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="1"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm focus:ring-1 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Visual File Upload Dropzone */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Hardware Visual Asset</label>
              <label className="flex flex-col items-center justify-center w-full h-24 border border-2 border-[#27272a] border-dashed rounded-xl cursor-pointer bg-[#121212] hover:bg-[#161616] hover:border-[#FFC107]/40 transition-all group">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-[#FFC107] group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-[#a1a1aa] font-medium max-w-[280px] truncate">
                    {localFile ? localFile.name : "Select or drag a hardware image cover"}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLocalFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Device Status Selector Segment */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Device Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['available', 'maintenance', 'occupied', 'inactive'].map((status) => (
                  <label key={status} className={`flex items-center justify-center cursor-pointer rounded-lg border py-2.5 text-xs font-bold transition-all ${previewStatus === status ? 'border-[#FFC107] bg-[#FFC107]/10 text-[#FFC107]' : 'border-[#27272a] bg-[#121212] text-[#a1a1aa] hover:border-zinc-700'}`}>
                    <input type="radio" name="status" value={status} className="hidden" checked={previewStatus === status} onChange={() => setPreviewStatus(status)} />
                    <span className="capitalize tracking-wide">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hardware Description Spec Box */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Description</label>
              <textarea name="specs" placeholder="GPU parameters, hardware models, preloaded setups..." className="w-full rounded-md border border-[#27272a] bg-[#121212] px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-[#FFC107] focus:border-[#FFC107] h-24 outline-none resize-none transition-colors" />
            </div>
          </div>

          {/* Right Preview Side-Panel */}
          <div className="w-full md:w-[350px] bg-[#121212] border-l border-[#27272a]/70 p-8 flex flex-col justify-between items-center flex-shrink-0">
            <div className="w-full flex-1 flex flex-col justify-center">
              <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-4 text-center">Card Display Preview</p>
              
              <Card className="bg-[#0a0a0a] border-[#27272a] overflow-hidden w-full max-w-[250px] mx-auto shadow-2xl">
                <div className="h-32 w-full bg-zinc-950 border-b border-[#27272a] flex items-center justify-center overflow-hidden relative">
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Preview display" className="w-full h-full object-cover animate-in fade-in duration-300" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-700 gap-1.5">
                      <ImageIcon className="h-5 w-5 text-zinc-600" />
                      <span className="text-[10px]">No asset selected</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-1.5 bg-[#1a1a1a] rounded-md border border-zinc-800"><Gamepad2 className="h-4 w-4 text-[#FFC107]" /></div>
                    <PreviewBadge previewStatus={previewStatus} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight uppercase">{previewStation || "STATION-ID"}</h3>
                    <p className="text-[#a1a1aa] text-[11px] flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FFC107]"></span>{previewType}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 text-xs">
                    <span className="text-[#a1a1aa] font-medium">Rate / Hour</span>
                    <span className="font-bold text-[#FFC107] text-sm">₹{hourlyRate || "0"}/hr</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900/40 pt-2 text-xs">
                    <span className="text-[#a1a1aa] font-medium">Stock Units</span>
                    <span className="font-bold text-white text-sm">{quantity || "1"} Units</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom Form Control Row */}
            <div className="w-full flex justify-end gap-3 mt-6 pt-4 border-t border-[#27272a]/40 flex-shrink-0">
              <Button type="button" variant="ghost" className="text-[#a1a1aa] hover:bg-zinc-900 hover:text-white" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-bold px-6 h-10 text-sm rounded-md shadow-md transition-all">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Device"}
              </Button>
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBadge({ previewStatus }: { previewStatus: string }) {
  if (previewStatus === 'available') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#FFC107] border border-[#FFC107]/30 rounded uppercase bg-[#FFC107]/5">Available</span>;
  if (previewStatus === 'maintenance') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">Maintenance</span>;
  if (previewStatus === 'inactive') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">Inactive</span>;
  return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#a1a1aa] border border-[#27272a] rounded uppercase bg-[#121212]">Occupied</span>;
}