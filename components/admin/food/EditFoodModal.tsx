"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { UploadCloud, Utensils, ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateMenuItem } from "@/app/(admin)/admin/food/actions";
import { supabase } from "@/lib/supabase/client";
import { MenuItem, FoodCategory, FoodStatus } from "@/lib/types/food";
import { toast } from "sonner";

interface EditFoodModalProps {
  item: MenuItem;
  onFormSuccess: () => void;
  onClose: () => void;
}

export function EditFoodModal({ item, onFormSuccess, onClose }: EditFoodModalProps) {
  const [isPending, startTransition] = useTransition();

  const [previewName, setPreviewName] = useState(item.name || "");
  const [category, setCategory] = useState<FoodCategory>(item.category || "Snacks");
  const [price, setPrice] = useState(item.price || "");
  const [quantity, setQuantity] = useState(item.quantity || "0");
  const [status, setStatus] = useState<FoodStatus>(item.status || "available");
  const [description, setDescription] = useState(item.description || "");
  const [localFile, setLocalFile] = useState<File | null>(null);

  const filePreviewUrl = useMemo(() => {
    if (localFile) return URL.createObjectURL(localFile);
    return item.image_url || null;
  }, [localFile, item.image_url]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetForm = e.currentTarget;

    startTransition(async () => {
      let bucketUrl = item.image_url || "";

      if (localFile) {
        const fileExt = localFile.name.split('.').pop();
        const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(uniqueFileName, localFile);

        if (uploadError) {
          toast.error("Bucket upload error: " + uploadError.message);
          return;
        }

        const { data: publicData } = supabase.storage
          .from('food-images')
          .getPublicUrl(uniqueFileName);

        bucketUrl = publicData.publicUrl;
      }

      const submissionFormData = new FormData(targetForm);
      submissionFormData.set("id", item.id);
      submissionFormData.set("image_url", bucketUrl);
      submissionFormData.set("category", category);
      submissionFormData.set("status", status);

      const result = await updateMenuItem(submissionFormData);
      if (result.success) {
        toast.success("Configuration Corrected", {
          description: `${previewName || "Menu item"} configuration sync complete.`,
          icon: <CheckCircle2 className="h-5 w-5 text-[#FFC107]" />
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
      <DialogContent className="bg-[#0a0a0a] border-[#27272a] text-white max-w-[900px] w-[95vw] p-0 overflow-hidden shadow-2xl h-auto max-h-[90vh] flex flex-col justify-between">
        
        {/* Header Panel */}
        <div className="p-6 border-b border-[#27272a]/70 bg-[#121212] flex-shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight text-white">Edit Food Configuration</DialogTitle>
          <p className="text-xs text-[#a1a1aa] mt-1">Override fields and live inventory stock limits</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">
          
          {/* Left Field Inputs Frame Grid */}
          <div className="flex-1 p-8 space-y-6 bg-[#0a0a0a] overflow-y-auto">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Item Name</label>
                <Input 
                  name="name"
                  value={previewName} 
                  onChange={(e) => setPreviewName(e.target.value)} 
                  className="h-10 bg-[#121212] border-[#27272a] text-sm text-white focus-visible:ring-[#FFC107] focus-visible:border-[#FFC107] transition-colors" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Category</label>
                <select 
                  name="category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as FoodCategory)} 
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm focus:ring-1 focus:ring-[#FFC107] outline-none text-white cursor-pointer transition-colors"
                >
                  <option value="Snacks">Snacks</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Meals">Meals</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Price (₹)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-[#a1a1aa] text-sm">₹</span>
                  </div>
                  <input 
                    type="number" 
                    name="price"
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] pl-7 pr-3 text-sm focus:ring-1 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Current Batch Stock</label>
                <input 
                  type="number" 
                  name="quantity"
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm focus:ring-1 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Override Image Asset</label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-[#27272a] border-dashed rounded-xl cursor-pointer bg-[#121212] hover:bg-[#161616] hover:border-[#FFC107]/40 transition-all group">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-[#FFC107] group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-[#a1a1aa] font-medium max-w-[280px] truncate">
                    {localFile ? localFile.name : "Select a file to upload custom update path"}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLocalFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Operational Availability</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['available', 'out_of_stock', 'hidden'].map((opt) => (
                  <label key={opt} className={`flex items-center justify-center cursor-pointer rounded-lg border py-2.5 text-xs font-bold transition-all ${status === opt ? 'border-[#FFC107] bg-[#FFC107]/10 text-[#FFC107]' : 'border-[#27272a] bg-[#121212] text-[#a1a1aa] hover:border-zinc-700'}`}>
                    <input type="radio" name="status_radio" value={opt} className="hidden" checked={status === opt} onChange={() => setStatus(opt as FoodStatus)} />
                    <span className="capitalize tracking-wide">{opt.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Description</label>
              <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-[#27272a] bg-[#121212] px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-[#FFC107] focus:border-[#FFC107] h-24 outline-none resize-none transition-colors" />
            </div>
          </div>

          {/* Right Static Preview Column — Non Scrolling */}
          <div className="w-full md:w-[350px] bg-[#121212] border-l border-[#27272a]/70 p-6 flex flex-col justify-start space-y-6 flex-shrink-0 overflow-hidden select-none h-full md:sticky md:top-0">
            <div className="w-full text-center md:text-left flex-shrink-0">
              <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">Adjusted Live Preview</p>
            </div>
            
            <div className="w-full flex-shrink-0 flex items-center justify-center">
              <Card className="bg-[#0a0a0a] border-[#27272a] overflow-hidden w-full max-w-[245px] shadow-2xl transition-all duration-300">
                <div className="h-32 w-full bg-zinc-950 border-b border-[#27272a] flex items-center justify-center overflow-hidden relative">
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Preview display" className="w-full h-full object-cover animate-in fade-in duration-300" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-700 gap-1.5">
                      <ImageIcon className="h-5 w-5 text-zinc-600" />
                      <span className="text-[10px]">No image asset mapped</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col space-y-3 bg-[#0a0a0a]">
                  <div className="flex justify-between items-start">
                    <div className="p-1.5 bg-[#1a1a1a] rounded-md border border-zinc-800"><Utensils className="h-4 w-4 text-[#FFC107]" /></div>
                    <PreviewFoodBadge previewStatus={status} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-black text-white tracking-tight truncate">{previewName || "FOOD ITEM TITLE"}</h3>
                    <p className="text-[#a1a1aa] text-[11px] flex items-center gap-1.5 truncate"><span className="w-1.5 h-1.5 rounded-full bg-[#FFC107] flex-shrink-0"></span>{category}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 text-xs">
                    <span className="text-[#a1a1aa] font-medium">Menu Price</span>
                    <span className="font-bold text-[#FFC107] text-sm">₹{price || "0"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900/40 pt-2 text-xs">
                    <span className="text-[#a1a1aa] font-medium">Stock Pool</span>
                    <span className="font-bold text-white text-sm">{quantity || "0"} Units</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Form control override submit footer layout alignment */}
            <div className="w-full flex justify-end gap-3 pt-6 border-t border-[#27272a]/40 flex-shrink-0 mt-auto">
              <Button type="button" variant="ghost" className="text-[#a1a1aa] hover:bg-zinc-900 hover:text-white transition-colors text-xs font-semibold" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-bold px-5 h-9 text-xs rounded-md shadow-md transition-all flex items-center justify-center gap-1.5">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply Overrides"}
              </Button>
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}

function PreviewFoodBadge({ previewStatus }: { previewStatus: string }) {
  if (previewStatus === 'available') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#FFC107] border border-[#FFC107]/30 rounded uppercase bg-[#FFC107]/5">Available</span>;
  if (previewStatus === 'out_of_stock') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">Out of Stock</span>;
  return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-zinc-500 border border-zinc-800 rounded uppercase bg-zinc-900">Hidden</span>;
}