'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  CheckCircle,
  Gamepad2,
  FileText,
  UtensilsCrossed,
  Wifi,
  Award,
  Armchair,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export default function SubscriptionActivatedPage() {
  const router = useRouter()

  return (
    <main
      className="min-h-screen bg-[#0a0a0a] text-white font-sans relative overflow-hidden flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-yellow-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="max-w-[1100px] w-full relative z-10">
        {/* Breadcrumb perfectly left-aligned at the top of the content container */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Subscriptions', href: '/customer/subscription' },
            { label: 'Monthly Pro', href: '/customer/subscription/monthly-pro' },
            { label: 'Success' },
          ]}
        />

        {/* Success Header */}
        <div className="flex flex-col items-center text-center mb-16 mt-4 md:mt-8">
          <div className="w-24 h-24 mb-8 rounded-full bg-[#131313] border border-yellow-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.15)] relative">
            <div className="absolute inset-0 rounded-full border border-yellow-500/40 animate-ping opacity-20"></div>
            <CheckCircle2 className="w-12 h-12 text-yellow-500" />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Subscription Activated!
          </h1>
          <p className="text-neutral-400 text-[15px] md:text-base max-w-lg mx-auto leading-relaxed">
            Your membership benefits are now active. Welcome to the inner circle of elite
            competitive gaming.
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {/* Left Column: Subscription Details */}
          <div className="lg:col-span-2 bg-[#131313] border border-neutral-800 rounded-md p-8 flex flex-col justify-between shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Subscription ID
                </p>
                <p className="text-yellow-500 font-bold text-lg">SUB-12345</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Current Plan
                </p>
                <p className="text-yellow-500 font-bold text-lg">Monthly Pro</p>
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Valid Until
                </p>
                <p className="text-white font-bold text-[17px]">June 07, 2026</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Membership Status
                </p>
                <div className="flex items-center text-yellow-500 font-bold text-[17px]">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse" />
                  Active & Secured
                </div>
              </div>
            </div>

            <div className="bg-[#1a1810] border border-yellow-500/20 rounded-md p-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 shrink-0" />
              <p className="text-neutral-300 text-sm font-medium">
                Your 20% elite discount has been applied to your membership summary.
              </p>
            </div>
          </div>

          {/* Right Column: Next Steps */}
          <div className="lg:col-span-1 bg-[#131313] border border-neutral-800 rounded-md p-8 flex flex-col shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Next Steps</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8">
              Ready to dominate? Book your exclusive gaming slot at the arena now.
            </p>

            <div className="mt-auto space-y-3">
              <button className="w-full bg-[#FFD700] hover:bg-[#F2C900] text-black font-bold text-[15px] py-4 rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:scale-[1.02]">
                <Gamepad2 className="w-5 h-5 mr-2" />
                Book Gaming Slot Now
              </button>

              <button
                onClick={() => router.push('/customer/my-subscription')}
                className="w-full bg-transparent border border-neutral-700 hover:border-yellow-500 text-white font-bold text-[15px] py-4 rounded-xl flex items-center justify-center transition-all hover:text-yellow-500"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Subscription Details
              </button>

              <button className="w-full text-neutral-400 hover:text-white font-medium text-sm py-3 mt-2 flex items-center justify-center transition-colors">
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Browse Food Menu
              </button>
            </div>
          </div>
        </div>

        {/* Elite Perks Section */}
        <div className="pt-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-10 tracking-tight">
            Your Elite Perks are Live
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#131313] border border-neutral-800 rounded-md p-8 transition-transform hover:-translate-y-1 hover:border-neutral-700">
              <Wifi className="w-6 h-6 text-yellow-500 mb-6" />
              <h4 className="text-lg font-bold text-white mb-3">Ultra-Low Latency</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Priority routing for your sessions ensures the fastest response times in the arena.
              </p>
            </div>

            <div className="bg-[#131313] border border-neutral-800 rounded-md p-8 transition-transform hover:-translate-y-1 hover:border-neutral-700">
              <Award className="w-6 h-6 text-yellow-500 mb-6" />
              <h4 className="text-lg font-bold text-white mb-3">Pro Gear Access</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Exclusive access to high-end mechanical peripherals and ergonomic seating reserved
                for pros.
              </p>
            </div>

            <div className="bg-[#131313] border border-neutral-800 rounded-md p-8 transition-transform hover:-translate-y-1 hover:border-neutral-700">
              <Armchair className="w-6 h-6 text-yellow-500 mb-6" />
              <h4 className="text-lg font-bold text-white mb-3">VIP Lounge</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Relax between tournaments in our soundproof glass lounge with complimentary
                refreshments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
