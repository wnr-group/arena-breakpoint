"use client";

import { CustomerRow } from "@/lib/types/customers";
import { Card } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, Mail, Phone, User, CalendarRange } from "lucide-react";

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
      <table className="w-full text-left border-collapse text-xs table-fixed min-w-[850px]">
        <thead>
          <tr className="border-b border-zinc-900 bg-zinc-950/20 text-zinc-500 font-black uppercase text-[10px] tracking-widest select-none">
            <th className="p-4 w-[24%]">Customer Profile</th>
            <th className="p-4 w-[18%]">Phone Terminal</th>
            <th className="p-4 w-[22%]">Email Address</th>
            <th className="p-4 w-[20%]">Membership Track</th>
            <th className="p-4 w-[16%] text-right">Expiration Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900/40 font-medium">
          {customers.map((row) => {
            const hasSub = !!row.subscription_name;
            const isActive = row.subscription_status === "active";

            return (
              <tr 
                key={row.id} 
                className="group hover:bg-zinc-950/40 transition-all duration-200 border-l-2 border-transparent hover:border-l-[#FFC107]"
              >
                {/* Customer Details Name Block */}
                <td className="p-4 font-black tracking-wide truncate flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-200 shadow-inner">
                    <User className="h-4 w-4  text-primary transition-colors" />
                  </div>
                  <span className="text-zinc-200 group-hover:text-primary transition-colors font-black text-sm tracking-normal truncate">
                    {row.name}
                  </span>
                </td>

                {/* Phone Terminal Output */}
                <td className="p-4 text-zinc-300 font-mono tracking-wider truncate">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-zinc-900/50 border border-zinc-800/80 rounded-md flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-bold text-zinc-300">{row.phone}</span>
                  </div>
                </td>

                {/* Email Address Block */}
                <td className="p-4 text-zinc-400 truncate font-medium">
                  {row.email ? (
                    <div className="flex items-center gap-2 truncate">
                      <div className="h-5 w-5 bg-zinc-900/50 border border-zinc-800/80 rounded-md flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary transition-colors" />
                      </div>
                      <span className="truncate text-zinc-400 group-hover:text-zinc-300 transition-colors">{row.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-700 italic">
                      <div className="h-5 w-5 bg-zinc-900/20 border border-zinc-900/40 rounded-md flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <span>No mail configured</span>
                    </div>
                  )}
                </td>

                {/* Subscription Plan State Badges */}
                <td className="p-4 whitespace-nowrap">
                  {hasSub ? (
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[9px] font-black uppercase rounded-lg tracking-widest shadow-sm ${
                        isActive 
                          ? "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]" 
                          : "bg-amber-500/5 text-zinc-500 border-zinc-800"
                      }`}>
                        {isActive ? (
                          <ShieldCheck className="h-3 w-3 text-green-400 animate-pulse" />
                        ) : (
                          <ShieldAlert className="h-3 w-3 text-zinc-600" />
                        )}
                        {row.subscription_name}
                      </span>
                    </div>
                  ) : (
                    <span className="bg-zinc-950/80 text-red-400 border border-zinc-900 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest select-none">
                      No Plan Active
                    </span>
                  )}
                </td>

                {/* Expiration Date Target */}
                <td className="p-4 text-right font-mono whitespace-nowrap">
                  {row.expiry_date ? (
                    <div className="inline-flex items-center justify-end gap-2">
                      <span className={`text-xs ${isActive ? "text-primary font-black drop-shadow-[0_0_6px_rgba(255,193,7,0.2)]" : "text-zinc-600 line-through font-semibold"}`}>
                        {new Date(row.expiry_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                      <CalendarRange className={`h-3.5 w-3.5 ${isActive ? "text-primary/70" : "text-zinc-700"}`} />
                    </div>
                  ) : (
                    <span className="text-zinc-800 font-sans italic text-[11px] pr-4">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}