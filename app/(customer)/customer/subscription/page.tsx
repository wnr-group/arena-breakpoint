import { ComparisonTable } from '@/components/customer/subscription/ComparisonTable'
import CTASection from '@/components/customer/subscription/CTASection'
import SubscriptionPricingCard from '@/components/customer/subscription/SubscriptionPricingCard'
import { Award } from 'lucide-react'
import React from 'react'

export default function SubscriptionPage() {
  return (
    // Reduced pb-24 to pb-8 to fix the excess space before the footer
    <main className="min-h-screen bg-black text-white font-sans pt-12 pb-8 px-0 sm:px-6 lg:px-8 mt-5">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-8 px-4">
          <div className="inline-flex items-center justify-center space-x-2 bg-[#1a1a1a] border border-neutral-800 rounded-full px-4 py-1.5 mb-6">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 text-xs font-bold tracking-widest uppercase">
              Membership Plans
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-[#FFCB8D] text-lg">
            Save on every booking with our subscription plans. Unlock exclusive elite gaming status
            and arena-wide benefits.
          </p>
        </div>

        {/* Interactive Pricing Cards */}
        <SubscriptionPricingCard />

        {/* Quick Comparison Section */}
        <ComparisonTable />

        {/* CTA Section */}
        <CTASection />
      </div>
    </main>
  )
}
