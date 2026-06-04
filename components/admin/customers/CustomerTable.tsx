"use client";

import { CustomerRow } from "@/lib/types/customers";
import { Card } from "@/components/ui/card";
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Phone,
  User,
  Cake
} from "lucide-react";
import { format } from "date-fns";

interface CustomerTableProps {
  customers: CustomerRow[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-zinc-600 border border-zinc-900 rounded-2xl bg-[#09090b]">
        No customer profile matches found in records registry.
      </div>
    );
  }

  return (
    <Card className="bg-[#0c0c0e]/40 border-zinc-900 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] w-full overflow-x-auto p-1">
      <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1000px]">
        <thead>
          <tr className="border-b border-zinc-900 bg-zinc-950/20 text-zinc-500 font-black uppercase text-[10px] tracking-widest select-none">
            <th className="p-4 w-[20%]">Customer Profile</th>
            <th className="p-4 w-[15%]">Phone Terminal</th>
            <th className="p-4 w-[15%]">Date of Birth</th>
            <th className="p-4 w-[20%]">Email Address</th>
            <th className="p-4 w-[12%]">Membership</th>
            <th className="p-4 w-[10%] text-right">Expiration</th>
            <th className="p-4 w-[8%] text-right">Created At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900/40 font-medium">
          {customers.map((row) => {
            const hasSub = !!row.subscription_name;
            const isActive = row.subscription_status === "active";

            return (
              <tr key={row.id} className="group hover:bg-zinc-950/40 transition-all duration-200 border-l-2 border-transparent hover:border-l-primary">

                {/* Customer Details Name Block */}
                <td className="p-4 font-black tracking-wide truncate flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-200 shadow-inner">
                    <User className="h-4 w-4 text-primary transition-colors" />
                  </div>
                  <span className="text-zinc-200 group-hover:text-primary transition-colors font-black text-sm tracking-normal truncate">
                    {row.name}
                  </span>
                </td>

                {/* Phone Terminal Output */}
                <td className="p-4 text-zinc-300 font-mono tracking-wider truncate">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-bold text-zinc-300">{row.phone}</span>
                  </div>
                </td>

                {/* Date of Birth Block */}
                <td className="p-4 text-zinc-300 font-mono tracking-wider truncate">
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-primary" />
                    <span className="font-bold text-zinc-300">
                      {row.date_of_birth ? format(new Date(row.date_of_birth), "dd MMM yyyy") : "—"}
                    </span>
                  </div>
                </td>

                {/* Email Address Block */}
                <td className="p-4 text-zinc-400 truncate font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate text-data-placeholder">{row.email || "No mail configured"}</span>
                  </div>
                </td>

                {/* Membership Track */}
                <td className="p-4 whitespace-nowrap">
                  {hasSub ? (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[9px] font-black uppercase rounded-lg tracking-widest ${isActive ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-zinc-900 text-zinc-500 border-zinc-800"}`}>
                      {isActive ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                      {row.subscription_name}
                    </span>
                  ) : (
                    <span className="bg-zinc-950/80 text-red-400 border border-zinc-900 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase">No Plan Active</span>
                  )}
                </td>

                {/* Expiration Date */}
                <td className="p-4 text-right font-mono text-xs">
                  {row.expiry_date ? (
                    <span className={isActive ? "text-primary font-bold" : "text-zinc-600 line-through"}>
                      {format(new Date(row.expiry_date), "dd/MM/yy")}
                    </span>
                  ) : "—"}
                </td>

                {/* Created At*/}
                <td className="p-4 text-right font-mono">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-data-visible font-bold">
                      {row.created_at ? format(new Date(row.created_at), "dd MMM yy") : "N/A"}
                    </span>
                    <span className="text-[12px] text-data-placeholder uppercase font-bold">
                      {row.created_at ? format(new Date(row.created_at), "HH:mm") : ""}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}