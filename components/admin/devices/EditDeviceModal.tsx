'use client'

<<<<<<< HEAD
import { useState, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Gamepad2, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateDevice } from '@/app/(admin)/admin/devices/actions'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
=======
import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Gamepad2, ImageIcon, Loader2, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import { updateDevice } from "@/app/(admin)/admin/devices/actions";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
>>>>>>> origin/feature/admin-customer-bookings

interface EditModalProps {
  device: any
  onFormSuccess: () => void
  onClose: () => void
}

export function EditDeviceModal({ device, onFormSuccess, onClose }: EditModalProps) {
  const [isPending, startTransition] = useTransition()

  // --- ACTIVE MODAL OBSERVER VALUE STATES ---
<<<<<<< HEAD
  const [editType, setEditType] = useState(device.type || 'PlayStation 5')
  const [editStation, setEditStation] = useState(device.station_number || '')
  const [editStatus, setEditStatus] = useState(device.status || 'available')
  const [hourlyRate, setHourlyRate] = useState(device.hourly_rate || '')
  const [quantity, setQuantity] = useState(device.quantity || '1')
  const [localFile, setLocalFile] = useState<File | null>(null)
=======
  const [editType, setEditType] = useState(device.type || "PlayStation 5");
  const [editStation, setEditStation] = useState(device.station_number || "");
  const [editStatus, setEditStatus] = useState(device.status || "available");
  const [hourlyRate, setHourlyRate] = useState(device.hourly_rate || "");
  const [localFile, setLocalFile] = useState<File | null>(null);
>>>>>>> origin/feature/admin-customer-bookings

  // Computes fallback path variables between historical bucket signatures or newly staged files
  const filePreviewUrl = useMemo(() => {
    if (localFile) return URL.createObjectURL(localFile)
    return device.image_url || null
  }, [localFile, device.image_url])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const targetForm = e.currentTarget

    startTransition(async () => {
      let finalImageUrl = device.image_url || ''

      // Check if a new file asset is uploaded to overwrite the historical one
      if (localFile) {
        const fileExt = localFile.name.split('.').pop()
        const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('device-images')
          .upload(uniqueFileName, localFile)

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('device-images')
            .getPublicUrl(uniqueFileName)
          finalImageUrl = publicData.publicUrl
        }
      }

<<<<<<< HEAD
      const submissionFormData = new FormData(targetForm)
      submissionFormData.set('id', device.id)
      submissionFormData.set('image_url', finalImageUrl)
=======
      const submissionFormData = new FormData(targetForm);
      submissionFormData.set('id', device.id);
      submissionFormData.set('image_url', finalImageUrl);
      submissionFormData.set('status', editStatus);
>>>>>>> origin/feature/admin-customer-bookings

      const result = await updateDevice(submissionFormData)
      if (result.success) {
        toast.success('Configuration Updated', {
          description: `Station ${editStation} overrides applied successfully.`,
          icon: <CheckCircle2 className="h-5 w-5 text-[#FFC107]" />,
        })
        onFormSuccess()
      } else {
        toast.error('Update Failed', {
          description: result.error,
          icon: <AlertCircle className="h-5 w-5 text-[#f43f5e]" />,
        })
      }
    })
  }

  return (
<<<<<<< HEAD
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-[#0a0a0a] border-[#27272a] text-white max-w-[850px] w-[95vw] p-0 overflow-hidden shadow-2xl h-[720px] max-h-[90vh] flex flex-col justify-between">
        {/* Header Panel */}
        <div className="p-5 border-b border-[#27272a] bg-[#121212] flex-shrink-0">
          <DialogTitle className="text-xl font-bold">Edit Device Configuration</DialogTitle>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Modify real-time arena metrics and track design layout card alterations instantly
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0"
        >
          {/* Left Panel: Grid Input Layout Container */}
          <div className="flex-1 p-6 flex flex-col justify-between bg-[#0a0a0a] h-full overflow-hidden">
            <div className="grid grid-cols-2 gap-4">
=======
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      {/* 💡 FIX: Removed strict h-[720px] limit. Enforced spacious padding boundaries and dynamic screen tracking overflow scroll layers */}
      <DialogContent className="bg-[#0a0a0a] border-[#27272a] text-white max-w-[900px] w-[95vw] p-0 overflow-hidden shadow-2xl h-auto max-h-[90vh] flex flex-col justify-between">
        
        {/* Header Panel */}
        <div className="p-6 border-b border-[#27272a]/70 bg-[#121212] flex-shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight text-white">Edit Device Configuration</DialogTitle>
          <p className="text-xs text-[#a1a1aa] mt-1">Modify real-time arena metrics and track design layout card alterations instantly</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">
          
          {/* Left Panel: Grid Input Layout Container */}
          <div className="flex-1 p-8 space-y-6 bg-[#0a0a0a] overflow-y-auto">
            
            {/* Form row block 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
>>>>>>> origin/feature/admin-customer-bookings
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Platform Type</label>
                <select
                  name="type"
                  value={editType}
<<<<<<< HEAD
                  onChange={e => setEditType(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm text-white focus:ring-1 focus:ring-[#FFC107] outline-none cursor-pointer"
                >
                  <option value="PS5" className="bg-[#121212]">
                    PlayStation 5
                  </option>
                  <option value="Standard Snooker" className="bg-[#121212]">
                    Standard Snooker
                  </option>
                  <option value="Medium Snooker" className="bg-[#121212]">
                    Medium Snooker
                  </option>
                  <option value="American Snooker" className="bg-[#121212]">
                    American Snooker
                  </option>
=======
                  onChange={(e) => setEditType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm focus:border-[#FFC107] focus:ring-1 focus:ring-[#FFC107] outline-none text-white cursor-pointer transition-colors"
                >
                  <option value="PS5" className="bg-[#121212]">PS 5</option>
                  <option value="Standard Snooker" className="bg-[#121212]">Standard Snooker</option>
                  <option value="Medium Snooker" className="bg-[#121212]">Medium Snooker</option>
                  <option value="American Snooker" className="bg-[#121212]">American Snooker</option>
>>>>>>> origin/feature/admin-customer-bookings
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Station ID</label>
                <Input
                  name="station_number"
                  value={editStation}
<<<<<<< HEAD
                  onChange={e => setEditStation(e.target.value)}
                  className="bg-[#121212] border-[#27272a] text-white focus-visible:ring-[#FFC107]"
=======
                  onChange={(e) => setEditStation(e.target.value)}
                  className="h-10 bg-[#121212] border-[#27272a] text-sm text-white focus-visible:ring-[#FFC107] focus-visible:border-[#FFC107] transition-colors"
>>>>>>> origin/feature/admin-customer-bookings
                  required
                />
              </div>
            </div>

<<<<<<< HEAD
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase">Hourly Rate</label>
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
                    onChange={e => setHourlyRate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] pl-7 pr-3 text-sm focus:ring-1 focus:ring-[#FFC107] outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-[#FFC107]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">
                  Available Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="1"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm focus:ring-1 focus:ring-[#FFC107] outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-[#FFC107]"
=======
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
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] pl-7 pr-3 text-sm focus:ring-1 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
>>>>>>> origin/feature/admin-customer-bookings
                  required
                />
              </div>
            </div>

            {/* 💡 FIX: Replaced simple input line with modern high-fidelity uploader field component */}
            <div className="space-y-2">
<<<<<<< HEAD
              <label className="text-xs font-bold text-[#a1a1aa] uppercase">
                Override Visual Image File
              </label>
              <Input
                type="file"
                accept="image/*"
                className="bg-[#121212] border-[#27272a] text-white cursor-pointer file:text-[#FFC107]"
                onChange={e => setLocalFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#a1a1aa] uppercase">
                Live Operational Status
              </label>
              <select
                name="status"
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full h-10 rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm text-white focus:ring-1 focus:ring-[#FFC107] outline-none cursor-pointer"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#a1a1aa] uppercase">
                Hardware Specs Overrides
              </label>
              <textarea
                name="specs"
                defaultValue={device.specs}
                className="w-full rounded-md border border-[#27272a] bg-[#121212] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#FFC107] h-20 outline-none resize-none"
              />
=======
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Hardware Visual Image</label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-[#27272a] border-dashed rounded-xl cursor-pointer bg-[#121212] hover:bg-[#161616] hover:border-[#FFC107]/40 transition-all group">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-[#FFC107] group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-[#a1a1aa] font-medium max-w-[280px] truncate">
                    {localFile ? localFile.name : "Choose a file to update existing image path"}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLocalFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* 💡 FIX: Upgraded layout status into a clean grid tracking radio node set */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Device Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['available', 'maintenance', 'occupied', 'inactive'].map((status) => (
                  <label key={status} className={`flex items-center justify-center cursor-pointer rounded-lg border py-2.5 text-xs font-bold transition-all ${editStatus === status ? 'border-[#FFC107] bg-[#FFC107]/10 text-[#FFC107]' : 'border-[#27272a] bg-[#121212] text-[#a1a1aa] hover:border-zinc-700'}`}>
                    <input type="radio" name="status_radio" value={status} className="hidden" checked={editStatus === status} onChange={() => setEditStatus(status)} />
                    <span className="capitalize tracking-wide">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Description</label>
              <textarea name="specs" defaultValue={device.specs} placeholder="GPU parameters, hardware configurations..." className="w-full rounded-md border border-[#27272a] bg-[#121212] px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-[#FFC107] focus:border-[#FFC107] h-24 outline-none resize-none transition-colors" />
>>>>>>> origin/feature/admin-customer-bookings
            </div>
          </div>

          {/* Right Panel - Sticky Card Display Preview & Save Action Footer */}
<<<<<<< HEAD
          <div className="w-full md:w-[360px] bg-[#121212] border-l border-[#27272a] p-6 flex flex-col justify-between items-center flex-shrink-0 h-full overflow-hidden">
            <div className="w-full">
              <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-4 text-left">
                Adjusted Display Preview
              </p>
              <Card className="bg-[#0a0a0a] border-[#27272a] overflow-hidden w-full max-w-[260px] mx-auto shadow-xl">
                <div className="h-32 w-full bg-zinc-950 border-b border-[#27272a] flex items-center justify-center overflow-hidden relative">
                  {filePreviewUrl ? (
                    <img
                      src={filePreviewUrl}
                      alt="Real-time layout sync"
                      className="w-full h-full object-cover animate-in fade-in"
                    />
=======
          <div className="w-full md:w-[350px] bg-[#121212] border-l border-[#27272a]/70 p-8 flex flex-col justify-between items-center flex-shrink-0">
            <div className="w-full flex-1 flex flex-col justify-center">
              <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-4 text-center">Adjusted Display Preview</p>
              
              <Card className="bg-[#0a0a0a] border-[#27272a] overflow-hidden w-full max-w-[250px] mx-auto shadow-2xl">
                <div className="h-32 w-full bg-zinc-950 border-b border-[#27272a] flex items-center justify-center overflow-hidden relative">
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Real-time layout sync" className="w-full h-full object-cover animate-in fade-in duration-300" />
>>>>>>> origin/feature/admin-customer-bookings
                  ) : (
                    <div className="flex flex-col items-center text-zinc-700 gap-1.5">
                      <ImageIcon className="h-5 w-5 text-zinc-600" />
                      <span className="text-[10px]">No image mapped</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-1.5 bg-[#1a1a1a] rounded-md border border-zinc-800">
                      <Gamepad2 className="h-4 w-4 text-[#FFC107]" />
                    </div>
                    <EditPreviewBadge previewStatus={editStatus} />
                  </div>
                  <div>
<<<<<<< HEAD
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {editStation || 'STATION-ID'}
                    </h3>
                    <p className="text-[#a1a1aa] text-xs flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFC107]"></span>
                      {editType}
                    </p>
=======
                    <h3 className="text-base font-black text-white tracking-tight uppercase">{editStation || "STATION-ID"}</h3>
                    <p className="text-[#a1a1aa] text-[11px] flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FFC107]"></span>{editType}</p>
>>>>>>> origin/feature/admin-customer-bookings
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 text-xs">
                    <span className="text-[#a1a1aa] font-medium">Rate / Hour</span>
<<<<<<< HEAD
                    <span className="font-bold text-[#FFC107] text-sm">
                      ₹{hourlyRate || '0'}/hr
                    </span>
                  </div>
                  {/* 💡 QUANTITY CARD NODE PREVIEW CONTAINER */}
                  <div className="flex items-center justify-between border-t border-zinc-900/50 pt-2 text-xs">
                    <span className="text-[#a1a1aa] font-medium">Stock Units</span>
                    <span className="font-bold text-white text-sm">{quantity || '1'} Units</span>
=======
                    <span className="font-bold text-[#FFC107] text-sm">₹{hourlyRate || "0"}</span>
>>>>>>> origin/feature/admin-customer-bookings
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom Footer Control Row */}
<<<<<<< HEAD
            <div className="w-full flex justify-end gap-2 mt-4 pt-4 border-t border-[#27272a]/40">
              <Button type="button" variant="ghost" onClick={onClose} className="text-[#a1a1aa]">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-bold px-6 h-10 text-sm rounded-md shadow-md"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply Overrides'}
=======
            <div className="w-full flex justify-end gap-3 mt-6 pt-4 border-t border-[#27272a]/40 flex-shrink-0">
              <Button type="button" variant="ghost" className="text-[#a1a1aa] hover:bg-zinc-900 hover:text-white" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-bold px-6 h-10 text-sm rounded-md shadow-md transition-all">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Overrides"}
>>>>>>> origin/feature/admin-customer-bookings
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditPreviewBadge({ previewStatus }: { previewStatus: string }) {
<<<<<<< HEAD
  if (previewStatus === 'available')
    return (
      <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-[#FFC107] border border-[#FFC107]/30 rounded uppercase bg-[#FFC107]/5">
        Available
      </span>
    )
  if (previewStatus === 'maintenance')
    return (
      <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">
        Maintenance
      </span>
    )
  if (previewStatus === 'inactive')
    return (
      <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">
        Inactive
      </span>
    )
  return (
    <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-[#a1a1aa] border border-[#27272a] rounded uppercase bg-[#121212]">
      Occupied
    </span>
  )
}
=======
  if (previewStatus === 'available') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#FFC107] border border-[#FFC107]/30 rounded uppercase bg-[#FFC107]/5">Available</span>;
  if (previewStatus === 'maintenance') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">Maintenance</span>;
  if (previewStatus === 'inactive') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">Inactive</span>;
  return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#a1a1aa] border border-[#27272a] rounded uppercase bg-[#121212]">Occupied</span>;
}
>>>>>>> origin/feature/admin-customer-bookings
