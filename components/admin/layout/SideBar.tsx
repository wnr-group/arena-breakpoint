"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Calendar, Monitor, Utensils, Tag, 
  PartyPopper, UserCheck, CreditCard, BarChart2, Settings, LogOut, ChevronLeft
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Bookings", href: "/admin/bookings", icon: Calendar },
  { name: "Devices", href: "/admin/devices", icon: Monitor },
  { name: "Food", href: "/admin/food", icon: Utensils },
  { name: "Promo Codes", href: "/admin/promo-codes", icon: Tag },
  { name: "Happy Hours", href: "/admin/happy-hours", icon: PartyPopper },
  { name: "Check-In", href: "/admin/check-in", icon: UserCheck },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Reports", href: "/admin/reports", icon: BarChart2 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function Sidebar({ isOpen, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* MOBILE OVERLAY DIMMER */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
        />
      )}

      {/* RENDER SIDEBAR CONTAINER */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 md:sticky flex-shrink-0 bg-[#0a0a0a] border-r border-[#27272a] flex flex-col h-screen transition-all duration-300 ease-in-out scrollbar-none ${
          isOpen ? "w-[260px] translate-x-0" : "w-[80px] -translate-x-full md:translate-x-0"
        }`}
      >
        
        {/* BRAND LOGO AREA + INTEGRATED DESKTOP/MOBILE CONTROLLER */}
        <div className="p-4 flex items-center justify-between border-b border-[#27272a]/40 h-20 overflow-hidden">
          {isOpen ? (
            <div className="pl-2 hover:scale-[1.02] transition-transform duration-300 cursor-pointer animate-in fade-in duration-300">
              <h1 className="text-lg font-black tracking-tight text-[#FFC107] drop-shadow-[0_0_10px_rgba(255,193,7,0.3)] whitespace-nowrap">
                Break Point Arena
              </h1>
              <p className="text-[10px] text-[#a1a1aa] mt-0.5 font-medium">Operational Command</p>
            </div>
          ) : (
            <div className="mx-auto text-[#FFC107] font-black text-xl animate-in fade-in duration-300">
              BP
            </div>
          )}

          {/* DYNAMIC TOGGLE SWITCH BUTTON */}
          <button 
            onClick={onToggle} 
            className={`p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a] transition-all border border-transparent hover:border-[#27272a] ${
              !isOpen ? "absolute right-3 top-5" : ""
            }`}
            aria-label="Toggle Navigation Layout Menu"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${!isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* NAVIGATION LINKS CONTAINER */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} onClick={onClose} title={!isOpen ? item.name : undefined}>
                <div
                  className={`flex items-center gap-3 py-3 rounded-xl transition-all duration-300 group animate-in slide-in-from-left-4 fade-in fill-mode-both ${
                    isOpen ? "px-4" : "justify-center px-0 h-11 w-11 mx-auto"
                  } ${
                    isActive
                      ? "bg-[#FFC107] text-black font-bold shadow-[0_0_20px_rgba(255,193,7,0.2)] scale-[1.02]"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a] hover:translate-x-1"
                  }`}
                  style={{ animationDelay: `${index * 30 + 50}ms` }}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
                      isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-6"
                    }`}
                  />
                  {isOpen && <span className="text-sm truncate animate-in fade-in duration-200">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT AREA PANEL */}
        <div className="p-3 border-t border-[#27272a] overflow-hidden">
          <button 
            className={`flex items-center gap-3 py-3 rounded-xl text-[#ef4444] hover:bg-red-500/10 transition-all duration-300 group ${
              isOpen ? "px-4 w-full" : "justify-center px-0 h-11 w-11 mx-auto"
            }`}
            title={!isOpen ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            {isOpen && <span className="text-sm font-semibold animate-in fade-in duration-200">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}