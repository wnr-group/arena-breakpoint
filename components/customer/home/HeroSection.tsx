'use client';

import React from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-[#050505] min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 md:px-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-16 md:gap-8">
          
          {/* Left Content Area */}
          <div className="flex-1 space-y-6 md:space-y-8 w-full max-w-xl mx-auto md:mx-0">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-[#111] border border-zinc-800 px-4 py-2 rounded-full w-max">
              <Flame size={16} className="text-orange-500" />
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-wide">
                Premium Gaming Experience
              </span>
            </div>
            
            {/* Main Headline - Adjusted text sizes to prevent overflow on medium screens */}
            <h1 className="text-5xl md:text-5xl lg:text-7xl font-bold leading-[1.1] text-white tracking-tight">
              Level Up Your <br />
              <span className="text-yellow-500">Gaming<br />Experience</span>
            </h1>
            
            {/* Subtext */}
            <p className="text-gray-400 text-base md:text-sm lg:text-lg leading-relaxed max-w-md">
              Step into India's premier digital battleground. Elite hardware, low-latency fibers, and a luxury lounge atmosphere designed for the serious competitor.
            </p>
            
            {/* Buttons - Stacked Vertically */}
            <div className="flex flex-col gap-4 pt-2">
              <Button 
                size="lg"
                className="flex items-center justify-center sm:justify-start gap-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full font-bold text-sm transition-transform hover:scale-105 w-full sm:w-max whitespace-nowrap h-14 px-8"
              >
                BOOK YOUR GAMING SLOT <ArrowRight size={18} />
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="flex items-center justify-center sm:justify-start bg-transparent border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-500 rounded-full font-bold text-sm transition-colors w-full sm:w-max whitespace-nowrap h-14 px-8"
              >
                VIEW SUBSCRIPTIONS
              </Button>
            </div>
          </div>

          {/* Right Content Area (Image & Badges) */}
          <div className="flex-1 relative w-full max-w-lg md:max-w-none mx-auto mt-12 md:mt-0">
            {/* Main Image */}
            <div className="relative aspect-square md:aspect-4/3 rounded-2xl overflow-hidden border border-zinc-800 bg-[#111]">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC__Tstjw8V1sJFIX_Gq64YktsN7ZoLhpifST0V3QexdYQOvo9RI_rwMxaSyeR6JLrLEcnP8wSwecNsbj-F0YzWuNFCrfWGojlm4FNasdF6j6NjWYPiQXIZwxXHYbarOAmF0Qz1LAVRjF_bvw80BHyVIa8o-JTJFXK3qUFSGjpYvxcVEWNGmSxEMwJUCN59QDhWFdFXkqZwEqBD3X0tlOZXttCF2g7JwxzIMk5X2oJSEb59OBAtg3yBA8Vs3bInrg1RWHA624AGSw" 
                alt="Elite Gaming Lounge" 
                className="object-cover w-full h-full opacity-70"
              />
            </div>

            {/* Floating Badge 1: 24 Stations (Top Left) */}
            <div className="absolute -top-6 -left-2 sm:-left-6 bg-[#121212] rounded-xl p-4 shadow-2xl border-t-2 border-l-2 border-yellow-500 border-r border-b border-r-zinc-800 border-b-zinc-800">
              <p className="text-yellow-500 font-bold text-xl leading-none mb-1">24</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Stations</p>
            </div>

            {/* Floating Badge 2: Open Today (Right Middle) */}
            <div className="absolute top-1/2 -right-2 sm:-right-8 -translate-y-1/2 bg-[#121212] rounded-xl p-4 shadow-2xl border-r-2  border-t border-l border-b border-yellow-500 flex items-center gap-3">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </div>
              <div>
                <p className="font-bold text-yellow-500 text-lg leading-none mb-1">Open</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Today</p>
              </div>
            </div>

            {/* Floating Badge 3: Save 20% (Bottom Left/Center) */}
            <div className="absolute -bottom-6 left-8 sm:left-16 bg-[#121212] rounded-xl px-6 py-4 shadow-2xl border-b-2  border-t border-l border-r border-yellow-500">
              <p className="text-yellow-500 font-bold text-lg uppercase leading-none mb-1">Save 20%</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">With Membership</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;