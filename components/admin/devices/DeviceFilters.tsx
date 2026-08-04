"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, List, LayoutGrid } from "lucide-react";

interface FilterProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  typeTab: string;
  setTypeTab: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  deviceTypes: any[];
}

export function DeviceFilters({
  searchQuery,
  setSearchQuery,
  typeTab,
  setTypeTab,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  deviceTypes
}: FilterProps) {
  return (
    <div className="flex flex-col gap-4 mt-2 animate-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
      {/* Category Tabs */}
      <div className="flex items-center gap-6 border-b border-[#e4e4e7] px-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setTypeTab("All Devices")}
          className={`pb-3 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            typeTab === "All Devices" ? "text-primary border-b-2 border-primary" : "text-[#52525b] hover:text-[#111115]"
          }`}
        >
          All Devices
        </button>
        {deviceTypes.map((dt) => (
          <button
            key={dt.id}
            onClick={() => setTypeTab(dt.id)}
            className={`pb-3 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              typeTab === dt.id ? "text-primary border-b-2 border-primary" : "text-[#52525b] hover:text-[#111115]"
            }`}
          >
            {dt.display_name}
          </button>
        ))}
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-[var(--surface)] border border-[#e4e4e7] rounded-xl p-2 transition-all duration-500 hover:border-[#3f3f46]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525b]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by station ID or type..."
            className="bg-transparent border-none pl-9 text-sm text-[#111115] focus-visible:ring-0"
          />
        </div>

        <div className="hidden md:block h-6 w-px bg-[#e4e4e7]"></div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-transparent text-[#52525b] hover:text-[#111115] text-sm border-none focus:ring-0 cursor-pointer outline-none px-2"
        >
          <option value="All" className="bg-[var(--surface)]">All Statuses</option>
          <option value="available" className="bg-[var(--surface)]">Available</option>
          <option value="occupied" className="bg-[var(--surface)]">Occupied</option>
          <option value="maintenance" className="bg-[var(--surface)]">Maintenance</option>
          <option value="inactive" className="bg-[var(--surface)]">Inactive</option>
        </select>

        <div className="h-6 w-px bg-[#e4e4e7]"></div>

        <Button
          variant="ghost"
          onClick={() => {
            setSearchQuery("");
            setTypeTab("All Devices");
            setStatusFilter("All");
          }}
          className="text-[#52525b] text-sm hover:bg-[var(--surface-hover)]"
        >
          Reset
        </Button>

        <div className="h-6 w-px bg-[#e4e4e7]"></div>

        <div className="flex bg-[var(--background)] rounded-lg p-1 border border-[#e4e4e7]">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-[#e4e4e7] text-[#111115]' : 'text-[#52525b]'}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#e4e4e7] text-[#111115]' : 'text-[#52525b]'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
