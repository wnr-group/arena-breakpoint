"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Link, ImageIcon, Loader2 } from "lucide-react";
import { updateMenuItem } from "@/app/(admin)/admin/food/actions";
import { MenuItem, FoodCategory, FoodStatus } from "@/lib/types/food"; // 💡 Imported union type safety constraints
import { toast } from "sonner";

export function EditFoodModal({ item, onFormSuccess, onClose }: { item: MenuItem; onFormSuccess: () => void; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(item.name || "");
  const [category, setCategory] = useState<FoodCategory>(item.category || "Snacks"); // 💡 Forced state assignment bounds
  const [price, setPrice] = useState(item.price || "");
  const [quantity, setQuantity] = useState(item.quantity || "0");
  const [status, setStatus] = useState<FoodStatus>(item.status || "available"); // 💡 Forced state assignment bounds
  const [description, setDescription] = useState(item.description || "");
  const [imageUrl, setImageUrl] = useState(item.image_url || "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      formData.set("id", item.id);

      const res = await updateMenuItem(formData);
      if (res.success) {
        toast.success("Café Configuration Corrected");
        onFormSuccess();
      } else {
        toast.error("Operation failed", { description: res.error });
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0a0a0a] border-[#27272a] text-white max-w-[850px] w-[95vw] p-0 overflow-hidden h-[640px] max-h-[90vh] flex flex-col justify-between shadow-2xl">
        <div className="p-5 border-b border-[#27272a] bg-[#121212]">
          <DialogTitle className="text-xl font-bold">Edit Food Configuration</DialogTitle>
          <p className="text-xs text-[#a1a1aa] mt-0.5">Override fields and live inventory stock limits</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 p-6 flex flex-col justify-between bg-[#0a0a0a] h-full overflow-hidden">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase">Item Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} name="name" className="bg-[#121212] border-[#27272a]" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase">Category</label>
                {/* 💡 Fixed: Explicitly typed target value casting string to FoodCategory */}
                <select 
                  name="category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as FoodCategory)} 
                  className="w-full h-10 rounded-md border border-[#27272a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FFC107]"
                >
                  <option value="Snacks">Snacks</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Meals">Meals</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase">Price (₹)</label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} name="price" className="bg-[#121212] border-[#27272a]" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase">Current Batch Stock</label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} name="quantity" className="bg-[#121212] border-[#27272a]" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#a1a1aa] uppercase">Operational Availability</label>
              <div className="flex gap-4 p-1">
                {['available', 'out_of_stock', 'hidden'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer capitalize text-zinc-300">
                    {/* 💡 Fixed: Explicitly typed target value casting string to FoodStatus */}
                    <input 
                      type="radio" 
                      name="status" 
                      value={opt} 
                      checked={status === opt} 
                      onChange={() => setStatus(opt as FoodStatus)} 
                      className="accent-[#FFC107] h-4 w-4" 
                    />
                    {opt.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#a1a1aa] uppercase">Description</label>
              <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-[#27272a] bg-[#121212] px-3 py-2 text-sm text-white h-16 outline-none resize-none focus:border-[#FFC107]" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#a1a1aa] uppercase">Asset Cover Link URL</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} name="image_url" className="bg-[#121212] border-[#27272a] pl-9 focus-visible:ring-[#FFC107]" />
              </div>
            </div>
          </div>

          <div className="w-full md:w-[360px] bg-[#121212] border-l border-[#27272a] p-6 flex flex-col justify-between items-center h-full overflow-hidden">
            <div className="w-full">
              <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-4">Adjusted Live Preview</p>
              <Card className="bg-[#0a0a0a] border-[#27272a] overflow-hidden w-full max-w-[260px] mx-auto shadow-xl">
                <div className="h-32 w-full bg-zinc-950 border-b border-[#27272a] flex items-center justify-center relative">
                  {imageUrl ? <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-zinc-700 flex flex-col items-center text-xs"><ImageIcon className="h-5 w-5 mb-1" /> No active configuration asset</div>}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">{category}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border rounded ${status === 'available' ? 'border-[#FFC107]/30 text-[#FFC107]' : 'border-red-500/30 text-red-400'}`}>{status.replace('_',' ')}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base truncate">{name || "Cyber Item Title"}</h4>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-2 text-xs">
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Stock Batch</span>
                    <span className="text-white font-bold">{quantity} Units</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900/50 pt-2 text-xs">
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Menu Price</span>
                    <span className="text-[#FFC107] font-black text-sm">₹{price || "0"}</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="w-full flex justify-end gap-2 border-t border-[#27272a]/40 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="text-[#a1a1aa]">Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-bold px-6">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Overrides"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}