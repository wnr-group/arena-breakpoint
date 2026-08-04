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
      <DialogContent className="bg-[var(--background)] border-[#e4e4e7] text-[#111115] max-w-[900px] w-[95vw] p-0 overflow-hidden shadow-2xl h-auto max-h-[90vh] flex flex-col justify-between">
        
        {/* Header Panel */}
        <div className="p-6 border-b border-[#e4e4e7]/70 bg-[var(--surface)] flex-shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight text-[#111115]">Edit Food Configuration</DialogTitle>
          <p className="text-xs text-[#52525b] mt-1">Override fields and live inventory stock limits</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">
          
          {/* Left Field Inputs Frame Grid */}
          <div className="flex-1 p-8 space-y-6 bg-[var(--background)] overflow-y-auto">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Item Name</label>
                <Input 
                  name="name"
                  value={previewName} 
                  onChange={(e) => setPreviewName(e.target.value)} 
                  className="h-10 bg-[var(--surface)] border-[#e4e4e7] text-sm text-[#111115] focus-visible:ring-primary focus-visible:border-primary transition-colors" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Category</label>
                <select 
                  name="category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as FoodCategory)} 
                  className="flex h-10 w-full rounded-md border border-[#e4e4e7] bg-[var(--surface)] px-3 text-sm focus:ring-1 focus:ring-[#FFC107] outline-none text-[#111115] cursor-pointer transition-colors"
                >
                  <option value="Snacks">Snacks</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Meals">Meals</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Price (₹)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-[#52525b] text-sm">₹</span>
                  </div>
                  <input 
                    type="number" 
                    name="price"
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="flex h-10 w-full rounded-md border border-[#e4e4e7] bg-[var(--surface)] pl-7 pr-3 text-sm focus:ring-1 focus:ring-[#FFC107] focus:border-primary outline-none text-[#111115] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Current Batch Stock</label>
                <input 
                  type="number" 
                  name="quantity"
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="flex h-10 w-full rounded-md border border-[#e4e4e7] bg-[var(--surface)] px-3 text-sm focus:ring-1 focus:ring-[#FFC107] focus:border-primary outline-none text-[#111115] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Override Image Asset</label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-[#e4e4e7] border-dashed rounded-xl cursor-pointer bg-[var(--surface)] hover:bg-[#e4e4e7] hover:border-primary/40 transition-all group">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-[#52525b] font-medium max-w-[280px] truncate">
                    {localFile ? localFile.name : "Select a file to upload custom update path"}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLocalFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Operational Availability</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['available', 'out_of_stock', 'hidden'].map((opt) => (
                  <label key={opt} className={`flex items-center justify-center cursor-pointer rounded-lg border py-2.5 text-xs font-bold transition-all ${status === opt ? 'border-primary bg-primary/10 text-primary' : 'border-[#e4e4e7] bg-[var(--surface)] text-[#52525b] hover:border-[#e4e4e7]'}`}>
                    <input type="radio" name="status_radio" value={opt} className="hidden" checked={status === opt} onChange={() => setStatus(opt as FoodStatus)} />
                    <span className="capitalize tracking-wide">{opt.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Description</label>
              <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-[#e4e4e7] bg-[var(--surface)] px-3 py-2.5 text-sm text-[#111115] focus:ring-1 focus:ring-[#FFC107] focus:border-primary h-24 outline-none resize-none transition-colors" />
            </div>
          </div>

          {/* Right Static Preview Column — Non Scrolling */}
          <div className="w-full md:w-[350px] bg-[var(--surface)] border-l border-[#e4e4e7]/70 p-6 flex flex-col justify-start space-y-6 flex-shrink-0 overflow-hidden select-none h-full md:sticky md:top-0">
            <div className="w-full text-center md:text-left flex-shrink-0">
              <p className="text-[11px] font-bold text-[#52525b] uppercase tracking-wider">Adjusted Live Preview</p>
            </div>
            
            <div className="w-full flex-shrink-0 flex items-center justify-center">
              <Card className="bg-[var(--background)] border-[#e4e4e7] overflow-hidden w-full max-w-[245px] shadow-2xl transition-all duration-300">
                <div className="h-32 w-full bg-[var(--background)] border-b border-[#e4e4e7] flex items-center justify-center overflow-hidden relative">
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Preview display" className="w-full h-full object-cover animate-in fade-in duration-300" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-700 gap-1.5">
                      <ImageIcon className="h-5 w-5 text-muted-content" />
                      <span className="text-[10px]">No image asset mapped</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col space-y-3 bg-[var(--background)]">
                  <div className="flex justify-between items-start">
                    <div className="p-1.5 bg-[var(--surface-hover)] rounded-md border border-[#e4e4e7]"><Utensils className="h-4 w-4 text-primary" /></div>
                    <PreviewFoodBadge previewStatus={status} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-black text-[#111115] tracking-tight truncate">{previewName || "FOOD ITEM TITLE"}</h3>
                    <p className="text-[#52525b] text-[11px] flex items-center gap-1.5 truncate"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>{category}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#e4e4e7]/60 pt-2 text-xs">
                    <span className="text-[#52525b] font-medium">Menu Price</span>
                    <span className="font-bold text-primary text-sm">₹{price || "0"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#e4e4e7]/40 pt-2 text-xs">
                    <span className="text-[#52525b] font-medium">Stock Pool</span>
                    <span className="font-bold text-[#111115] text-sm">{quantity || "0"} Units</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Form control override submit footer layout alignment */}
            <div className="w-full flex justify-end gap-3 pt-6 border-t border-[#e4e4e7]/40 flex-shrink-0 mt-auto">
              <Button type="button" variant="ghost" className="text-[#52525b] hover:bg-[#e4e4e7] hover:text-[#111115] transition-colors text-xs font-semibold" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-bold px-5 h-9 text-xs rounded-md shadow-md transition-all flex items-center justify-center gap-1.5">
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
  if (previewStatus === 'available') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/30 rounded uppercase bg-primary/5">Available</span>;
  if (previewStatus === 'out_of_stock') return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">Out of Stock</span>;
  return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-secondary-content border border-[#e4e4e7] rounded uppercase bg-[#e4e4e7]">Hidden</span>;
}