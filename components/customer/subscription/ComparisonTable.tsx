'use client'

import React from 'react'
export interface SubscriptionPlanDB {
  id: number
  name: string
  description: string | null
  duration_days?: number
  duration_months?: number
  price: number
  discount_percentage: number
  is_active: boolean
}

interface ComparisonTableProps {
  plans?: SubscriptionPlanDB[]
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ plans = [] }) => {
  // Do not render the table if there are no active plans
  if (!plans || plans.length === 0) {
    return null
  }

  const activePlans = plans.filter(plan => plan.is_active)

  return (
    <div
      className="w-full mt-12 overflow-x-auto px-4 pb-12"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @keyframes savingsGlow {
          0%, 100% {
            box-shadow: 0 0 6px rgba(255, 193, 7, 0.35), 0 0 2px rgba(255, 193, 7, 0.2);
            filter: brightness(1);
          }
          50% {
            box-shadow: 0 0 16px rgba(255, 193, 7, 0.8), 0 0 8px rgba(255, 193, 7, 0.4);
            filter: brightness(1.2);
          }
        }
        .animate-savings-glow {
          animation: savingsGlow 2.5s infinite ease-in-out;
        }
      `}</style>
      <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-10 tracking-tight">
        Quick Comparison
      </h2>

      <div className="max-w-250 mx-auto min-w-200 rounded-xl overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="grid grid-cols-[1.5fr_0.8fr_1fr_1fr_2.7fr] bg-[#2B271E] p-5">
          {['Plan', 'Price', 'Duration', 'Savings', 'Benefits'].map((heading, i) => (
            <div 
              key={i} 
              className="font-bold text-[13px] md:text-[14px] text-left pl-6 uppercase tracking-wider"
              style={{ color: 'var(--primary)' }}
            >
              {heading}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div className="flex flex-col">
          {activePlans.map((plan, i) => {
            const duration = plan.duration_months
              ? `${plan.duration_months} Months`
              : `${plan.duration_days || 30} Days`

            const savings =
              plan.discount_percentage > 0 ? `Up to ${plan.discount_percentage}%` : 'None'

            const topBenefit = plan.description
              ? plan.description.split(',')[0].trim()
              : 'Standard Access'

            return (
              <div
                key={plan.id}
                className={`grid grid-cols-[1.5fr_0.8fr_1fr_1fr_2.7fr] p-5 items-center transition-colors ${i % 2 === 0 ? 'bg-[#191919]' : 'bg-[#222222]'
                  }`}
              >
                <div className="font-bold text-white pl-6 text-[14px] md:text-[15px] text-left">
                  {plan.name}
                </div>
                <div className="text-neutral-300 pl-6 text-[14px] md:text-[15px] font-medium text-left">
                  ₹{plan.price}
                </div>
                <div className="text-neutral-300 pl-6 text-[14px] md:text-[15px] font-medium text-left">
                  {duration}
                </div>
                <div className="pl-6 text-left">
                  {plan.discount_percentage > 0 ? (
                    <span className="inline-block px-3 py-1 text-xs md:text-[13px] font-extrabold bg-gradient-primary text-black rounded-full shadow-[0_0_10px_rgba(255,193,7,0.25)] border border-[#FFD54F]/30 uppercase tracking-wide animate-savings-glow">
                      Up to {plan.discount_percentage}%
                    </span>
                  ) : (
                    <span className="text-neutral-500 text-[14px] md:text-[15px] font-medium">
                      None
                    </span>
                  )}
                </div>
                <div className="text-neutral-300 pl-6 text-[14px] md:text-[15px] font-medium text-left">
                  {topBenefit}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
