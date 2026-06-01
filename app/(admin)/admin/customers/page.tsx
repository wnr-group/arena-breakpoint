"use client";

import { useEffect, useState } from "react";
import { getLiveCustomerRegistryAction } from "./actions";
import { CustomerTable } from "@/components/admin/customers/CustomerTable";
import { CustomerRow } from "@/lib/types/customers";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminCustomersDashboard() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCustomerDatabase();
  }, []);

  async function loadCustomerDatabase() {
    setLoading(true);
    const res = await getLiveCustomerRegistryAction();
    if (res.error) toast.error(res.error);
    else setCustomers(res.data as CustomerRow[]);
    setLoading(false);
  }

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      (customer.email && customer.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-white p-2 sm:p-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-[#FFC107]" /> Customer Directory
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Monitor registered players, search demographics info, and verify subscription tracks.
          </p>
        </div>
      </div>

      <div className="relative max-w-md group">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500 group-focus-within:text-[#FFC107] transition-colors" />
        <Input
          type="text"
          placeholder="Search by name, phone number, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#111] border-zinc-800 h-11 pl-11 text-xs font-medium text-white placeholder-zinc-600 rounded-xl focus-visible:ring-1 focus-visible:ring-[#FFC107] focus-visible:border-transparent transition-all group-hover:border-zinc-700 w-full"
        />
      </div>

      {loading ? (
        <div className="h-48 w-full flex items-center justify-center border border-zinc-900 rounded-xl bg-[#111]">
          <Loader2 className="h-6 w-6 text-[#FFC107] animate-spin" />
        </div>
      ) : (
        <CustomerTable customers={filteredCustomers} />
      )}
    </div>
  );
}