"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Calendar, Monitor, Utensils, Tag,
  PartyPopper, BarChart2, LogOut, ChevronLeft,
  User2Icon, Crown, Clock, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { getUserRole, type UserRole } from "@/lib/auth/roles";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/admin/bookings", icon: Calendar },
  { name: "Timeline", href: "/admin/timeline", icon: Clock },
  { name: "Devices", href: "/admin/devices", icon: Monitor },
  { name: "Food", href: "/admin/food", icon: Utensils },
  { name: "Customers", href: "/admin/customers", icon: User2Icon },
  { name: "Subscription", href: "/admin/subscription", icon: Crown },
  { name: "Promo Codes", href: "/admin/promo-code", icon: Tag },
  { name: "Happy Hours", href: "/admin/happy-hours", icon: PartyPopper },
  { name: "Reports", href: "/admin/reports", icon: BarChart2 },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function Sidebar({ isOpen, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Get user role on mount
    getUserRole().then(setUserRole);
  }, []);

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => {
    // Hide Reports if user is staff
    if (item.href === "/admin/reports" && userRole === "staff") {
      return false;
    }
    return true;
  });

  // Only dismiss the panel drawer on mobile devices (< 768px tailwind breakpoint)
  const handleNavigationClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error('Logout Failed', {
          description: 'An error occurred while signing out',
        });
        setLoggingOut(false);
        return;
      }

      toast.success('Logged Out', {
        description: 'You have been signed out successfully',
      });

      // Close the drawer so it is not left open behind the login screen
      onClose();
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      toast.error('Logout Failed', {
        description: 'An unexpected error occurred',
      });
      setLoggingOut(false);
    }
  };

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
        className={`fixed top-0 bottom-0 left-0 z-50 md:sticky flex-shrink-0 bg-[var(--background)] border-r border-[#27272a] flex flex-col h-screen transition-all duration-300 ease-in-out scrollbar-none ${isOpen ? "w-[260px] translate-x-0" : "w-[80px] -translate-x-full md:translate-x-0"
          }`}
      >

        {/* BRAND LOGO AREA + INTEGRATED DESKTOP/MOBILE CONTROLLER */}
        <div className="p-4 flex items-center justify-between border-b border-[#27272a]/40 h-20 overflow-hidden">
          {isOpen ? (
            <div className="pl-2 flex items-center gap-3 hover:scale-[1.02] transition-transform duration-300 cursor-pointer animate-in fade-in duration-300">
              <Image
                src="/bp_logo.png"
                alt="Breakpoint Arena"
                width={40}
                height={40}
                className="w-10 h-10 object-contain rounded-md"
                priority
              />
              <div>
                <h1 className="text-lg font-black tracking-tight text-primary drop-shadow-[0_0_10px_rgba(184,134,11,0.3)] whitespace-nowrap">
                  Break Point Arena
                </h1>
                <p className="text-[10px] text-[#a1a1aa] mt-0.5 font-medium">Admin Panel</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto animate-in fade-in duration-300">
              <Image
                src="/bp_logo.png"
                alt="BP"
                width={40}
                height={40}
                className="w-10 h-10 object-contain rounded-md"
                priority
              />
            </div>
          )}

          {/* DYNAMIC TOGGLE SWITCH BUTTON */}
          <button
            onClick={onToggle}
            className={`p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[var(--surface-hover)] transition-all border border-transparent hover:border-[#27272a] ${!isOpen ? "absolute right-3 top-5" : ""
              }`}
            aria-label="Toggle Navigation Layout Menu"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${!isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* NAVIGATION LINKS CONTAINER */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
          {filteredNavItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavigationClick}
                title={!isOpen ? item.name : undefined}
              >
                <div
                  className={`flex items-center gap-3 py-3 rounded-xl transition-all duration-300 group animate-in slide-in-from-left-4 fade-in fill-mode-both ${isOpen ? "px-4" : "justify-center px-0 h-11 w-11 mx-auto"
                    } ${isActive
                      ? "bg-gradient-primary text-[var(--button-text)] font-bold glow-primary scale-[1.02]"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[var(--surface-hover)] hover:translate-x-1"
                    }`}
                  style={{ animationDelay: `${index * 30 + 50}ms` }}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-6"
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
            onClick={handleLogout}
            disabled={loggingOut}
            className={`flex items-center gap-3 py-3 rounded-xl text-[#ef4444] hover:bg-red-500/10 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed ${isOpen ? "px-4 w-full" : "justify-center px-0 h-11 w-11 mx-auto"
              }`}
            title={!isOpen ? "Logout" : undefined}
          >
            {loggingOut ? (
              <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            )}
            {isOpen && (
              <span className="text-sm font-semibold animate-in fade-in duration-200">
                {loggingOut ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}