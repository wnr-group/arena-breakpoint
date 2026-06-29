'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

// The DB Interface
interface SubscriptionPlanDB {
  id: number
  name: string
  description: string | null
  duration_days?: number
  duration_months?: number
  price: number
  discount_percentage: number
  applicable_days?: string[] | null
  is_active: boolean
}

// Define the props for this component
interface SubscriptionPricingCardProps {
  initialPlans: SubscriptionPlanDB[]
}

const SubscriptionPricingCard: React.FC<SubscriptionPricingCardProps> = ({ initialPlans }) => {
  const router = useRouter()
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null)

  const plans = useMemo(() => {
    return initialPlans
      .filter(plan => plan.is_active)
      .map(plan => {
        const discountFeature =
          plan.discount_percentage > 0
            ? `${plan.discount_percentage}% off all bookings`
            : 'Standard arena pricing'

        const otherFeatures = plan.description
          ? plan.description.split(',').map(f => f.trim())
          : ['Standard Access']

        return {
          id: plan.id,
          category: plan.discount_percentage >= 20 ? 'CORE GAMER' : 'ENTRY LEVEL',
          title: plan.name,
          price: plan.price,
          duration: `/ ${plan.duration_months ? plan.duration_months + ' Months' : plan.duration_days + ' Days' || '30 Days'}`,
          features: [discountFeature, ...otherFeatures],
          isPopular: plan.discount_percentage >= 20,
          badge: plan.discount_percentage >= 20 ? '★ POPULAR' : null,
          buttonText: 'Select Plan',
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
        payload => {
          console.log('Database changed! Fetching fresh data...', payload)
          router.refresh()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  const defaultPlanId = plans[0]?.id || ''
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
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-primary/20 via-amber-400/20 to-amber-500/20 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-l from-amber-500/15 via-amber-400/15 to-primary/15 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-300 mx-auto relative z-10 w-full">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-8 px-[5vw] md:px-8 hide-scrollbar items-stretch justify-start">
          {plans.map(plan => {
            const isActive = activeCard === plan.id

            return (
              <div
                key={plan.id}
                onClick={() => setActiveCard(plan.id)}
                className={`gaming-card relative flex flex-col flex-none w-[90vw] md:w-[80vw] max-w-85 md:max-w-75 h-auto snap-center rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-500 ease-out border overflow-hidden group ${
                  isActive
                    ? 'border-primary/60 bg-gradient-to-br from-zinc-900 via-[#131313] to-zinc-900 shadow-[0_0_60px_rgba(255,193,7,0.3),inset_0_0_60px_rgba(255,193,7,0.05)] scale-100 z-10 opacity-100'
                    : 'border-zinc-800 bg-gradient-to-br from-zinc-950 via-[#131313] to-zinc-950 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(255,193,7,0.15)] lg:scale-95 opacity-90 hover:opacity-100 z-0'
                }`}
              >
                {/* Animated gradient border effect */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-amber-400 to-primary opacity-20 blur-xl animate-pulse pointer-events-none" />
                )}

                {/* Scan line animation */}
                {isActive && (
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                  </div>
                )}

                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary via-amber-400 to-primary text-black shadow-[0_0_20px_rgba(255,193,7,0.6)] animate-glow'
                        : 'bg-zinc-900 text-primary border border-primary/30'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6 mt-2 text-left border-b border-zinc-800/50 pb-6 relative z-10">
                  <span className="text-zinc-500 text-xs font-black tracking-[0.2em] uppercase block mb-2">
                    {plan.category}
                  </span>
                  <h3 className={`text-xl md:text-2xl font-black mb-3 tracking-tight transition-all duration-300 ${
                    isActive ? 'text-transparent bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text' : 'text-white'
                  }`}>
                    {plan.title}
                  </h3>
                  <div className="flex items-baseline">
                    <span className={`text-3xl md:text-4xl font-black tracking-tighter transition-all duration-300 ${
                      isActive ? 'text-transparent bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text' : 'text-white'
                    }`}>
                      ₹{plan.price}
                    </span>
                    <span className="text-zinc-500 ml-2 text-xs md:text-sm font-bold">
                      {plan.duration}
                    </span>
                  </div>
                </div>

                <ul className="grow space-y-3.5 mb-8 relative z-10">
                  {plan.features.map((feature: string, idx: number) => (
                    <li
                      key={idx}
                      className={`flex items-start text-sm font-medium transition-all duration-300 ${
                        isActive ? 'text-zinc-200' : 'text-zinc-400'
                      }`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mr-3 shrink-0 mt-0.5 transition-all duration-300 ${
                          isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(255,193,7,0.6)]' : 'text-zinc-600'
                        }`}
                      />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                 <button
                  onClick={e => {
                    e.stopPropagation()
                    setLoadingPlanId(plan.id)
                    router.push(`/subscription/${plan.id}`)
                  }}
                  disabled={loadingPlanId !== null}
                  className={`relative w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 mt-auto overflow-hidden group/btn flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary via-amber-400 to-primary text-black hover:shadow-[0_0_30px_rgba(255,193,7,0.5)] hover:scale-[1.02]'
                      : 'bg-transparent border-2 border-zinc-800 text-zinc-400 hover:border-primary hover:text-primary hover:shadow-[0_0_20px_rgba(255,193,7,0.2)]'
                  }`}
                >
                  {loadingPlanId === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    isActive && (
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                    )
                  )}
                  <span className="relative z-10">{loadingPlanId === plan.id ? 'Loading...' : plan.buttonText}</span>
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

        @keyframes scan-line {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(400px);
          }
        }

        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 193, 7, 0.6);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 193, 7, 0.8);
          }
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .gaming-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 193, 7, 0.1), transparent);
          transition: left 0.7s;
        }

        .gaming-card:hover::before {
          left: 100%;
        }
      `,
        }}
      />
    </section>
  )
}

export default SubscriptionPricingCard
