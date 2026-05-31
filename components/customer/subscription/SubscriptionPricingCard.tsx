'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// The DB Interface
interface SubscriptionPlanDB {
  id: number;
  name: string;
  description: string | null; 
  duration_days?: number;
  duration_months?: number;
  price: number;
  discount_percentage: number;
  applicable_days?: string[] | null; 
  is_active: boolean;
}

// Define the props for this component
interface SubscriptionPricingCardProps {
  initialPlans: SubscriptionPlanDB[]
}

const SubscriptionPricingCard: React.FC<SubscriptionPricingCardProps> = ({ initialPlans }) => {
  const router = useRouter()

  const plans = useMemo(() => {
    return initialPlans
      .filter((plan) => plan.is_active)
      .map((plan) => {
        const discountFeature = plan.discount_percentage > 0 
          ? `${plan.discount_percentage}% off all bookings` 
          : 'Standard arena pricing';

        const otherFeatures = plan.description 
          ? plan.description.split(',').map(f => f.trim()) 
          : ['Standard Access'];

        return {
          id: plan.id,
          category: plan.discount_percentage >= 20 ? 'CORE GAMER' : 'ENTRY LEVEL', 
          title: plan.name,
          price: plan.price,
          duration: `/ ${plan.duration_months ? plan.duration_months + ' Months' : (plan.duration_days + ' Days' || '30 Days')}`, 
          features: [discountFeature, ...otherFeatures],
          isPopular: plan.discount_percentage >= 20,
          badge: plan.discount_percentage >= 20 ? '★ POPULAR' : null,
          buttonText: 'Select Plan'
        }
      })
  }, [initialPlans])

  // SUPABASE REALTIME CHANGES
  useEffect(() => {
    
    // Subscribe to any changes on the subscription_plans table
    const channel = supabase
      .channel('public:subscription_plans')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, and DELETE
          schema: 'public',
          table: 'subscription_plans',
        },
        (payload) => {
          console.log('Database changed! Fetching fresh data...', payload)
          router.refresh()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  const defaultPlanId = plans.find(p => p.isPopular)?.id || plans[0]?.id || ''
  const [activeCard, setActiveCard] = useState<number | string>(defaultPlanId)

  if (plans.length === 0) {
    return (
      <div className="text-center text-neutral-400 py-24 min-h-100 flex items-center justify-center">
        No subscription plans are currently available.
      </div>
    )
  }

  return (
    <section
      className="bg-transparent overflow-hidden relative py-5 md:py-2"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-300 mx-auto relative z-10 w-full ">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-8 px-[5vw] md:px-8 hide-scrollbar items-stretch justify-start">
          {plans.map((plan) => {
            const isActive = activeCard === plan.id

            return (
              <div
                key={plan.id}
                onClick={() => setActiveCard(plan.id)}
                className={`relative flex flex-col flex-none w-[90vw] md:w-[80vw] max-w-85 md:max-w-75 h-auto snap-center rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-500 ease-out border  ${
                  isActive
                    ? 'border-yellow-500/60 bg-[#131313] shadow-[0_0_40px_rgba(234,179,8,0.1)] scale-100 z-10 opacity-100'
                    : 'border-neutral-800 bg-[#131313] hover:bg-[#111111] hover:border-neutral-700 lg:scale-95 opacity-80 hover:opacity-100 z-0'
                }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                        : 'bg-[#1a1a1a] text-yellow-500 border border-yellow-500/30'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6 mt-2 text-left border-b border-neutral-800/50 pb-6">
                  <span className="text-neutral-400 text-xs font-semibold tracking-wider uppercase block mb-1">
                    {plan.category}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{plan.title}</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                      ₹{plan.price}
                    </span>
                    <span className="text-neutral-400 ml-2 text-xs md:text-sm font-medium">
                      {plan.duration}
                    </span>
                  </div>
                </div>

                <ul className="grow space-y-3.5 mb-8">
                  {plan.features.map((feature: string, idx: number) => (
                    <li
                      key={idx}
                      className={`flex items-start text-sm font-medium transition-colors ${
                        isActive ? 'text-neutral-200' : 'text-neutral-400'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mr-3 shrink-0 mt-0.5 transition-colors ${
                          isActive ? 'text-yellow-500' : 'text-neutral-600'
                        }`}
                      />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={e => {
                    e.stopPropagation()
                    router.push(`/customer/subscription/${plan.id}`)
                  }}
                  className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-300 mt-auto ${
                    isActive
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-md'
                      : 'bg-transparent border border-neutral-700 text-neutral-300 hover:border-yellow-500 hover:text-yellow-500'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </section>
  )
}

export default SubscriptionPricingCard