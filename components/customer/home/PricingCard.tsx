'use client';

import React, { useState } from 'react';
import { Gamepad2, Monitor, CheckCircle2, Gamepad } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pricingPlans = [
  {
    id: 'ps5',
    category: 'SONY PLATFORM',
    title: 'PlayStation 5',
    price: 300,
    features: ['4K HDR Gaming', 'DualSense Controllers', 'Access to PS+ Deluxe'],
    icon: Gamepad2,
    isPopular: false,
    buttonText: 'SELECT PLATFORM'
  },
  {
    id: 'pc',
    category: 'MASTER RACE',
    title: 'Gaming PC',
    price: 350,
    features: ['RTX 4080 Super Series', '240Hz Pro Monitors', 'Mechanical Keyboards', 'Pro Gaming Headsets'],
    icon: Monitor,
    isPopular: true,
    buttonText: 'BOOK STATION'
  },
  {
    id: 'xbox',
    category: 'MICROSOFT PLATFORM',
    title: 'Xbox Series X',
    price: 300,
    features: ['Game Pass Ultimate', 'Native 4K Gameplay', 'Dolby Atmos Support'],
    icon: Gamepad,
    isPopular: false,
    buttonText: 'SELECT PLATFORM'
  },
  {
    id: 'ybox',
    category: 'MICROSOFT PLATFORM',
    title: 'Xbox Series S',
    price: 200,
    features: ['Game Pass Ultimate', '1440p Gameplay', 'Dolby Atmos Support'],
    icon: Gamepad,
    isPopular: false,
    buttonText: 'SELECT PLATFORM'
  },  
  {
    id: 'zbox',
    category: 'NINTENDO PLATFORM',
    title: 'Switch OLED',
    price: 150,
    features: ['Handheld Mode', 'Joy-Con Controllers', 'Exclusive Nintendo Titles'],
    icon: Gamepad,
    isPopular: false,
    buttonText: 'SELECT PLATFORM'
  },
];

const PricingCard: React.FC = () => {
  const [activeCard, setActiveCard] = useState<string>('pc');

  return (
    <section className="bg-[#050505] py-16 md:py-24 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-350 mx-auto relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3 px-4">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Today's Elite Pricing
          </h2>
          <p className="text-sm md:text-base text-gray-400 font-medium">
            Premium performance for every platform. No hidden charges.
          </p>
        </div>

       
        <div className="w-full">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-12 pt-6 px-4 md:px-8 hide-scrollbar items-center">
            
            {pricingPlans.map((plan) => {
              const Icon = plan.icon;
              const isActive = activeCard === plan.id;
              
              return (
                <div 
                  key={plan.id} 
                  onClick={() => setActiveCard(plan.id)}
                  
                  className={`relative flex-none w-65 sm:w-70 snap-center rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-300 ease-out border ${
                    isActive 
                      ? 'border-yellow-500 bg-[#111] scale-[1.03] shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10 opacity-100' 
                      : 'border-zinc-800 bg-[#0a0a0a] scale-100 hover:border-zinc-700 opacity-60 hover:opacity-100 z-0'
                  }`}
                >
                  {plan.isPopular && (
                    <>
                      <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl transition-colors ${isActive ? 'bg-yellow-500' : 'bg-zinc-800'}`} />
                      <div className={`absolute -top-3 right-5 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md transition-colors ${isActive ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                        Most Popular
                      </div>
                    </>
                  )}
                  
                  
                  <div className="flex justify-between items-start mb-4 mt-1">
                    <div>
                      <p className="text-yellow-500 text-[9px] font-bold uppercase tracking-widest mb-1.5">
                        {plan.category}
                      </p>
                      <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">{plan.title}</h3>
                    </div>
                    <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-900 text-zinc-500'}`}>
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  
                  <div className="mb-5 flex items-baseline">
                    <span className="text-3xl md:text-4xl font-black text-white">₹{plan.price}</span>
                    <span className="text-zinc-500 font-medium ml-1 text-xs md:text-sm">/hr</span>
                  </div>
                  
                  
                  <ul className="space-y-3 mb-6 min-h-30">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className={`flex items-start text-xs font-medium transition-colors ${isActive ? 'text-gray-200' : 'text-gray-400'}`}>
                        <CheckCircle2 className={`mr-2.5 shrink-0 mt-0.5 transition-colors ${isActive ? 'text-yellow-500' : 'text-zinc-600'}`} size={14} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={`w-full rounded-full font-bold uppercase tracking-widest text-[9px] md:text-[10px] h-10 transition-all ${
                      isActive 
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-black border-transparent' 
                        : 'border-zinc-700 hover:border-yellow-500 text-zinc-400 hover:text-yellow-500 bg-transparent'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              );
            })}

          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
};

export default PricingCard;