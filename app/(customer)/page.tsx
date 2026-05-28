"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Monitor, Gamepad2, Tv } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full space-y-16 pb-12">
      <div 
        className="relative w-full rounded-3xl border border-zinc-900 bg-[#0c0c0c] overflow-hidden min-h-[520px] sm:min-h-[580px] flex items-center shadow-2xl bg-cover bg-center bg-no-repeat animate-in fade-in zoom-in-95 duration-700 ease-out"
        style={{ 
          backgroundImage: `linear-gradient(to right, #000000 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.2) 100%), url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop')` 
        }}
      >
        {/* Ambient Dark-Vignette Overlay Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-black/40 z-10" />
        
        {/* Status Tag Header Pill */}
        <div className="absolute top-6 right-32 bg-black/80 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2 z-20 hidden sm:flex animate-in fade-in duration-1000 delay-300 fill-mode-both">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] text-green-400 font-black uppercase tracking-wider">Open Live</span>
        </div>

        {/* Hero Text Content Column */}
        <div className="relative z-20 max-w-[620px] pl-6 sm:pl-12 lg:pl-16 pr-6 py-12 space-y-6 text-left">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121212]/90 backdrop-blur-sm border border-zinc-800 rounded-md text-[10px] font-black tracking-widest text-[#FFC107] uppercase animate-in slide-in-from-top-4 fade-in duration-500 ease-out">
            ⚡ PREMIUM GAMING EXPERIENCE
          </div>
          
          {/* Main Typography Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.02] text-white animate-in slide-in-from-left-6 fade-in duration-700 delay-100 fill-mode-both">
            LEVEL UP YOUR <br />
            <span className="text-[#FFC107] drop-shadow-[0_0_35px_rgba(255,193,7,0.2)] animate-pulse duration-3000">GAMING EXPERIENCE</span>
          </h1>
          
          {/* Supporting Copywriter Description Paragraph */}
          <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-[490px] font-medium drop-shadow-md animate-in slide-in-from-left-6 fade-in duration-700 delay-200 fill-mode-both">
            Step into India's premier digital battleground. Elite hardware setups, low-latency fibers, and a luxury lounge atmosphere designed for the serious competitor.
          </p>
          
          {/* Call-To-Action Intercept Button Layout Wrappers */}
          <div className="flex flex-wrap items-center gap-3 pt-3 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-300 fill-mode-both">
            <Link href="/booking">
              <Button className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-black uppercase text-xs h-12 px-6 rounded-md tracking-wider flex items-center gap-2 shadow-xl transition-all hover:scale-102 active:scale-98 hover:shadow-[#FFC107]/10 hover:shadow-2xl">
                BOOK YOUR GAMING SLOT <ArrowRight className="h-4 w-4 stroke-[3]" />
              </Button>
            </Link>
            
            <Link href="/subscription">
              <Button variant="outline" className="border border-zinc-800 text-zinc-400 hover:text-white bg-black/40 backdrop-blur-sm hover:bg-zinc-900 font-black uppercase text-xs h-12 px-6 rounded-md tracking-wider transition-all hover:border-zinc-500 hover:scale-102 active:scale-98">
                VIEW SUBSCRIPTIONS
              </Button>
            </Link>
          </div>
          <div className="inline-flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-zinc-900 rounded-lg p-2.5 pr-4 text-[11px] font-bold text-zinc-400 animate-in fade-in duration-700 delay-500 fill-mode-both">
            <span className="text-[8px] font-black uppercase bg-[#FFC107]/10 text-[#FFC107] px-2 py-1 border border-[#FFC107]/20 rounded animate-pulse">GOLD TIER</span>
            <span>🛡️ SAVE 20% ON SLOTS WITH MEMBERSHIP</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRICING MATRIX CONTAINER WITH STAGGERED GRID    */}
      {/* ========================================================= */}
      <div className="space-y-8 pt-6 border-t border-zinc-900">
        
        {/* Section Heading Label Texts */}
        <div className="text-center space-y-1.5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">Today's Elite Pricing</h2>
          <p className="text-xs text-zinc-500 font-medium">Premium performance for every platform. No hidden charges.</p>
        </div>

        {/* Cards Response Multi-Column Deck Mapping */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: PlayStation 5 */}
          <Card className="bg-[#121212] border border-zinc-900 p-6 rounded-xl flex flex-col justify-between shadow-lg group hover:border-zinc-800 transition-all hover:-translate-y-1 duration-300 animate-in slide-in-from-bottom-8 fade-in duration-500 delay-300 fill-mode-both">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-black uppercase bg-zinc-950 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-sm tracking-wider">CONSOLE</span>
                  <h3 className="text-base font-black text-white uppercase tracking-tight mt-2.5 group-hover:text-[#FFC107] transition-colors">PlayStation 5</h3>
                </div>
                <Tv className="h-4 w-4 text-zinc-700 group-hover:text-[#FFC107] group-hover:rotate-3 transition-all" />
              </div>
              <p className="text-3xl font-black text-white">₹ 300<span className="text-[11px] text-zinc-500 font-bold"> /hr</span></p>
              <ul className="space-y-2 text-[11px] text-zinc-400 font-semibold border-t border-zinc-900 pt-4">
                <li>• 4K HDR Fluid Display</li>
                <li>• DualSense Spatial Shocks</li>
                <li>• Premium Catalog Access</li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/booking" className="block">
                <Button variant="outline" className="w-full border-zinc-800 bg-transparent text-xs font-black uppercase py-4 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-950 hover:border-zinc-600 transition-all active:scale-98">
                  SELECT PLATFORM
                </Button>
              </Link>
            </div>
          </Card>

          {/* Card 2: Gaming PC (Highlighted Best Value Deck) */}
          <Card className="bg-[#121212] border border-[#FFC107] p-6 rounded-xl flex flex-col justify-between shadow-2xl relative group hover:-translate-y-1 duration-300 shadow-[#FFC107]/5 animate-in slide-in-from-bottom-8 fade-in duration-500 delay-400 fill-mode-both">
            <div className="absolute top-0 right-4 bg-[#FFC107] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-b tracking-widest animate-bounce duration-2000 mt-0">
              BEST VALUE
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-black uppercase bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/20 px-2 py-0.5 rounded-sm tracking-wider">ULTIMATE Rigs</span>
                  <h3 className="text-base font-black text-white uppercase tracking-tight mt-2.5">Gaming PC</h3>
                </div>
                <Monitor className="h-4 w-4 text-[#FFC107] group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-3xl font-black text-[#FFC107] drop-shadow-[0_0_15px_rgba(255,193,7,0.1)]">₹ 350<span className="text-[11px] text-zinc-600 font-bold"> /hr</span></p>
              <ul className="space-y-2 text-[11px] text-zinc-300 font-semibold border-t border-zinc-900 pt-4">
                <li>• RTX 4080 Super Frameworks</li>
                <li>• 240Hz Pro Monitors</li>
                <li>• Mechanical Response Decks</li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/booking" className="block">
                <Button className="w-full bg-[#FFC107] hover:bg-[#ffcd38] text-black text-xs font-black uppercase py-4 rounded-md shadow-md transition-all active:scale-98 hover:shadow-[#FFC107]/20 hover:shadow-lg">
                  BOOK STATION
                </Button>
              </Link>
            </div>
          </Card>

          {/* Card 3: Xbox Series X */}
          <Card className="bg-[#121212] border border-zinc-900 p-6 rounded-xl flex flex-col justify-between shadow-lg group hover:border-zinc-800 transition-all hover:-translate-y-1 duration-300 animate-in slide-in-from-bottom-8 fade-in duration-500 delay-500 fill-mode-both">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-black uppercase bg-zinc-950 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-sm tracking-wider">CONSOLE TIER</span>
                  <h3 className="text-base font-black text-white uppercase tracking-tight mt-2.5 group-hover:text-[#FFC107] transition-colors">Xbox Series X</h3>
                </div>
                <Gamepad2 className="h-4 w-4 text-zinc-700 group-hover:text-[#FFC107] group-hover:-rotate-3 transition-all" />
              </div>
              <p className="text-3xl font-black text-white">₹ 300<span className="text-[11px] text-zinc-500 font-bold"> /hr</span></p>
              <ul className="space-y-2 text-[11px] text-zinc-400 font-semibold border-t border-zinc-900 pt-4">
                <li>• Game Pass Ultimate Enabled</li>
                <li>• Native 4K Master Sync</li>
                <li>• Dolby Spatial Integration</li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/booking" className="block">
                <Button variant="outline" className="w-full border-zinc-800 bg-transparent text-xs font-black uppercase py-4 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-950 hover:border-zinc-600 transition-all active:scale-98">
                  SELECT PLATFORM
                </Button>
              </Link>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}