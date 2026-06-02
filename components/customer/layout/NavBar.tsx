"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#0c0c0c] border-b border-zinc-900 px-4 sm:px-8 py-5 flex items-center justify-between sticky top-0 z-40 transition-all">
      
      {/* BRAND SITE NAME LOGO */}
      <Link href="/" className="text-white font-black text-xl tracking-tight uppercase select-none transition-transform active:scale-97">
        BREAK POINT <span className="text-primary">ARENA</span>
      </Link>
      
      {/* DESKTOP ROUTING LINKS ROW */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-black uppercase tracking-widest text-zinc-400">
        <Link 
          href="/" 
          className={pathname === "/" ? "text-primary border-b-2 border-primary pb-1" : "hover:text-white transition-colors"}
        >
          Home
        </Link>
        <Link 
          href="/subscription" 
          className={pathname === "/subscriptions" ? "text-primary border-b-2 border-primary pb-1" : "hover:text-white transition-colors"}
        >
          Subscriptions
        </Link>
        <Link 
          href="/retrieve" 
          className={pathname === "/retrieve" ? "text-primary border-b-2 border-primary pb-1" : "hover:text-white transition-colors"}
        >
          Retrieve Booking
        </Link>
        
        {/* Action CTAs */}
        <Link href="/food">
          <button className="bg-primary hover:bg-primary-hover text-black font-black text-[10px] tracking-wider rounded-md px-4 py-2.5 transition-all active:scale-95 ml-4">
            FOOD MENU
          </button>
        </Link>
        <Link href="/booking">
          <button className="bg-primary hover:bg-primary-hover text-black font-black text-[10px] tracking-wider rounded-md px-4 py-2.5 transition-all active:scale-95">
            BOOK SLOT
          </button>
        </Link>
      </nav>

      {/* MOBILE HAMBURGER TOGGLE BUTTON */}
      <button 
        onClick={() => setMobileMenuOpen(true)} 
        className="md:hidden p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* MOBILE EXPANDED MENU DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#060606]/98 z-50 flex flex-col justify-center items-center p-6 animate-in fade-in zoom-in-95 duration-200">
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            className="absolute top-5 right-5 p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-transform active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center gap-6 text-base font-black uppercase tracking-widest w-full max-w-xs text-zinc-400">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className={pathname === "/" ? "text-primary" : "hover:text-white"}>Home</Link>
            <Link href="/subscription" onClick={() => setMobileMenuOpen(false)} className={pathname === "/subscriptions" ? "text-primary" : "hover:text-white"}>Subscriptions</Link>
            <Link href="/retrieve" onClick={() => setMobileMenuOpen(false)} className={pathname === "/retrieve" ? "text-primary" : "hover:text-white"}>Retrieve Booking</Link>

            <Link href="/food" className="w-full" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full bg-primary text-black font-black py-4 rounded-xl text-xs tracking-widest shadow-md transition-transform active:scale-97 mt-4">
                FOOD MENU
              </button>
            </Link>
            <Link href="/booking" className="w-full" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full bg-primary text-black font-black py-4 rounded-xl text-xs tracking-widest shadow-md transition-transform active:scale-97">
                BOOK SLOT
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}