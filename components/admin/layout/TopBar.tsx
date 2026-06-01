"use client";

import { Search, Bell, Grid, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  onToggleSidebar?: () => void;
  onOpenSidebar: () => void;
}

export function Topbar({ onToggleSidebar, onOpenSidebar }: TopbarProps) {
  return (
    <header className="h-[72px] flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#27272a] flex items-center justify-between px-4 md:px-8 animate-in slide-in-from-top-full duration-500 z-40">
      <div className="flex items-center gap-3 flex-1 max-w-md md:max-w-xl pr-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onOpenSidebar} 
          className="text-white hover:bg-[#1a1a1a] md:hidden flex-shrink-0 h-9 w-9"
          aria-label="Open navigation sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden sm:flex items-center w-full relative group transition-all duration-500 focus-within:max-w-lg">
          <Search className="absolute left-3 h-4 w-4 text-[#a1a1aa] group-focus-within:text-[#FFC107] transition-colors duration-300" />
          <Input
            type="text"
            placeholder="Search operations..."
            className="bg-[#121212] border border-transparent pl-10 text-white placeholder:text-[#a1a1aa] focus-visible:ring-1 focus-visible:ring-[#FFC107]/50 focus-visible:border-[#FFC107] focus-visible:bg-[#1a1a1a] shadow-none text-sm w-full transition-all duration-300 rounded-full"
          />
        </div>
      </div>

      {/* Right Block: Actions Tray & Profile Widget */}
      <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
        
        {/* Action Quick Toggles Utilities */}
        <div className="flex items-center gap-2 md:gap-4 text-[#a1a1aa]">
          <button className="sm:hidden p-2 hover:text-white transition-colors duration-300">
            <Search className="h-5 w-5" />
          </button>

          <button className="p-1 md:p-2 hover:text-white transition-all duration-300 relative group">
            <Bell className="h-5 w-5 group-hover:origin-top group-hover:animate-bounce" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#ef4444] animate-pulse"></span>
          </button>
          
          <button className="p-1 md:p-2 hover:text-white transition-all duration-300 group hover:rotate-90 hidden xs:block">
            <Grid className="h-5 w-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-[#27272a]"></div>

        {/* User Account Frame Section */}
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group select-none">
          <div className="text-right transition-transform duration-300 group-hover:-translate-x-0.5 hidden md:block">
            <p className="text-sm font-bold text-white group-hover:text-[#FFC107] transition-colors leading-tight">Alex Mercer</p>
            <p className="text-[10px] text-[#a1a1aa] uppercase tracking-widest mt-0.5 leading-none">Arena Manager</p>
          </div>
          
          {/* Profile Circle Avatar Frame */}
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#27272a] border-2 border-transparent group-hover:border-[#FFC107] group-hover:shadow-[0_0_15px_rgba(255,193,7,0.3)] transition-all duration-300 overflow-hidden transform group-hover:scale-105">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=FFC107" 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

      </div>
    </header>
  );
}