"use client";

import { PromoCodeRow } from "@/lib/types/promo-code";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2 } from "lucide-react";

interface PromoCodeTableProps {
  promos: PromoCodeRow[];
  onEdit: (row: PromoCodeRow) => void;
  onDelete: (id: number) => void;
}

export function PromoCodeTable({ promos, onEdit, onDelete }: PromoCodeTableProps) {
  if (promos.length === 0) {
    return (
      <div className="p-12 text-center text-xs font-medium text-zinc-600 border border-zinc-900 rounded-xl bg-[#111]">
        No promo campaigns deployed to database records.
      </div>
    );
  }

  return (
    <Card className="bg-[#111] border-zinc-900 rounded-xl overflow-hidden shadow-2xl w-full overflow-x-auto">
      <div className="p-4 bg-zinc-950/40 border-b border-zinc-900 font-black text-xs uppercase text-zinc-400 tracking-wider">
        Active Promo Code List
      </div>
      <table className="w-full text-left border-collapse text-xs table-fixed min-w-[800px]">
        <thead>
          <tr className="border-b border-zinc-900 bg-zinc-950/20 text-zinc-500 font-black uppercase text-[10px] tracking-wider select-none">
            <th className="p-4 w-[20%]">Code</th>
            <th className="p-4 w-[30%]">Description</th>
            <th className="p-4 w-[15%]">Discount</th>
            <th className="p-4 w-[20%]">Validity Period</th>
            <th className="p-4 w-[15%]">Status</th>
            <th className="p-4 text-right w-24 min-w-[96px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900/60 font-medium">
          {promos.map((row) => (
            <tr key={row.id} className="group hover:bg-zinc-950/30 transition-colors">
              <td className="p-4 font-black text-[#FFC107] tracking-wide uppercase truncate">{row.code}</td>
              <td className="p-4 text-zinc-400 truncate">{row.description || "—"}</td>
              <td className="p-4 text-white font-bold whitespace-nowrap">
                {row.discount_type === "percentage" ? `${parseInt(row.discount_value as any, 10)}% Off` : `₹${parseInt(row.discount_value as any, 10)}`}
              </td>
              <td className="p-4 text-zinc-500 font-mono whitespace-nowrap">
                {row.valid_from} <span className="text-zinc-700 mx-0.5">to</span> {row.valid_to}
              </td>
              <td className="p-4 whitespace-nowrap">
                {row.is_active ? (
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Live</span>
                ) : (
                  <span className="bg-zinc-900 text-zinc-600 border border-zinc-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Inactive</span>
                )}
              </td>
              <td className="p-4 w-24 min-w-[96px] whitespace-nowrap">
                <div className="flex justify-end gap-1.5 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                  <Button onClick={() => onEdit(row)} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-[#FFC107] hover:bg-zinc-900 rounded-md">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button onClick={() => onDelete(row.id)} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-md">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}