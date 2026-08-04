import React from 'react'
import { Award } from 'lucide-react'
import { ComparisonTable } from '@/components/customer/subscription/ComparisonTable'
import SubscriptionPricingCard from '@/components/customer/subscription/SubscriptionPricingCard'
import { getSubscriptionPlans } from '@/app/(admin)/admin/subscription/actions'

export default async function SubscriptionPage() {
  const response = await getSubscriptionPlans()
  const plansData = response.success && response.data ? response.data : []

  return (
    <main className="min-h-screen bg-white text-[#111115] font-sans pt-12 pb-8 px-0 sm:px-6 lg:px-8 mt-5 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-white to-white pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-amber-500/10 rounded-full blur-[150px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-orange-600/10 to-primary/10 rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMTkzLDcsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-primary/10 via-amber-400/10 to-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-6 backdrop-blur-sm">
            <Award className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-primary text-xs font-black tracking-[0.2em] uppercase">
              Membership Plans
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-gradient-to-r from-[#111115] via-amber-600 to-[#111115] bg-clip-text mb-6 tracking-tight leading-tight">
            Choose Your Subscription Plan
          </h1>
          <p className="text-[#52525b] text-lg leading-relaxed">
            Save on every booking with our subscription plans. Unlock exclusive{' '}
            <span className="text-transparent bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text font-bold">elite gaming status</span>
            {' '}and arena-wide benefits.
          </p>
        </div>

        {/* Pricing card */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <SubscriptionPricingCard initialPlans={plansData} />
        </div>

        {/* Comparison table */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <ComparisonTable plans={plansData} />
        </div>
      </div>
    </main>
  )
}
