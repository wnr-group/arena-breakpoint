"use client";

import { useEffect, useState } from "react";
import { getLivePromoListAction, executePromoDeletionAction } from "./actions";
import { PromoCodeTable } from "@/components/admin/promo-code/PromoCodeTable";
import { AddPromoCodeModal } from "@/components/admin/promo-code/AddPromoCodeModal";
import { EditPromoCodeModal } from "@/components/admin/promo-code/EditPromoCodeModal";
import { PromoCodeRow } from "@/lib/types/promo-code";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminPromoCodeDashboard() {
  const [promos, setPromos] = useState<PromoCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCodeRow | null>(null);

  useEffect(() => {
    loadPromoInventoryGrid();
  }, []);

  async function loadPromoInventoryGrid() {
    setLoading(true);
    const res = await getLivePromoListAction();
    if (res.error) toast.error(res.error);
    else setPromos(res.data as PromoCodeRow[]);
    setLoading(false);
  }

  const handleOpenEditModal = (target: PromoCodeRow) => {
    setSelectedPromo(target);
    setIsEditOpen(true);
  };

  const handleTriggerDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this promo code record?")) return;
    const res = await executePromoDeletionAction(id);
    if (res.success) {
      toast.success("Coupon dropped successfully.");
      loadPromoInventoryGrid();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-white p-2 sm:p-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Promo Code Management</h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Configure and monitor structural discount campaigns across the arena platform stores.</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)} 
          className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-black uppercase text-xs h-11 px-5 rounded-lg tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Create Promo Code
        </Button>
      </div>

      {loading ? (
        <div className="h-48 w-full flex items-center justify-center border border-zinc-900 rounded-xl bg-[#111]">
          <Loader2 className="h-6 w-6 text-[#FFC107] animate-spin" />
        </div>
      ) : (
        <PromoCodeTable promos={promos} onEdit={handleOpenEditModal} onDelete={handleTriggerDelete} />
      )}

      {isAddOpen && (
        <AddPromoCodeModal 
          isOpen={isAddOpen} 
          onClose={() => setIsAddOpen(false)} 
          onRefresh={loadPromoInventoryGrid} 
        />
      )}

      {isEditOpen && selectedPromo && (
        <EditPromoCodeModal 
          isOpen={isEditOpen} 
          onClose={() => {
            setIsEditOpen(false);
            setSelectedPromo(null);
          }} 
          editingPromo={selectedPromo} 
          onRefresh={loadPromoInventoryGrid} 
        />
      )}
    </div>
  );
}