"use client";

import React from "react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-[#0c0c0c] py-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-auto">
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        <p className="text-white font-black tracking-tight text-sm">BREAK POINT <span className="text-[#FFC107]">ARENA</span></p>
        <div className="flex justify-center gap-6 text-zinc-500 font-black text-[9px] tracking-widest uppercase">
          <span>Contact</span>
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Rentals</span>
        </div>
        <p className="pt-2 text-zinc-700">© 2026 BREAK POINT ARENA. ELITE GAMING EXCLUSIVITY. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
}