'use client'

import React from 'react'
import { Percent, Gamepad2, Ticket, Wallet, Monitor, AlertTriangle, History } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export default function MySubscriptionPage() {
  return (
    <main
      className="min-h-screen bg-[#0a0a0a] text-white font-sans py-8 md:py-12"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'My Subscription' }]} />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-[42px] font-extrabold text-white mb-3 tracking-tight leading-tight">
              Your Subscription
            </h1>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
              Manage your elite gaming access and monitor your exclusive benefits across the Break
              Point Arena ecosystem.
            </p>
          </div>
          <div className="flex flex-row gap-3 md:gap-4 shrink-0">
            <button className="flex-1 md:flex-none bg-transparent border border-yellow-500 hover:bg-yellow-500/10 text-yellow-500 font-bold py-3 px-6 rounded-lg transition-colors text-sm">
              Renew Now
            </button>
            <button className="flex-1 md:flex-none bg-[#FFD700] hover:bg-[#F2C900] text-black font-bold py-3 px-6 rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(255,215,0,0.15)]">
              Book Slot
            </button>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column (Main Subscription & Savings) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Subscription Card */}
            <div className="bg-[#111111] border border-neutral-800 rounded-md p-6 md:p-8">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-yellow-500 text-xs font-bold tracking-widest uppercase mb-1">
                    Elite Membership
                  </h3>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">Monthly Pro</h2>
                </div>
                <div className="bg-[#1a1a1a] border border-neutral-700/50 rounded-full px-3 py-1.5 flex items-center shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-neutral-200 text-xs font-bold tracking-wider uppercase">
                    Active
                  </span>
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <div className="text-neutral-400 text-xs font-semibold mb-1">
                      Validity Status
                    </div>
                    <div className="text-white font-bold text-lg">
                      Valid until June 07{' '}
                      <span className="text-yellow-500 text-sm ml-1">(23 days remaining)</span>
                    </div>
                  </div>
                  <div className="text-neutral-400 text-xs font-bold">77% Complete</div>
                </div>
                {/* Bar */}
                <div className="w-full bg-[#222222] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-yellow-600 to-yellow-400 h-2.5 rounded-full"
                    style={{ width: '77%' }}
                  ></div>
                </div>
              </div>

              {/* Perks Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-4 flex items-center">
                  <div className="bg-yellow-500/10 p-3 rounded-sm mr-4">
                    <Percent className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-neutral-400 text-xs font-semibold mb-0.5">
                      Loyalty Discount
                    </div>
                    <div className="text-white font-extrabold text-lg">20% OFF</div>
                  </div>
                </div>
                <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-4 flex items-center">
                  <div className="bg-yellow-500/10 p-3 rounded-sm mr-4">
                    <Gamepad2 className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-neutral-400 text-xs font-semibold mb-0.5">Arena Pass</div>
                    <div className="text-white font-extrabold text-lg">All Access</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Section */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4">Your Savings So Far</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Total Bookings */}
                <div className="bg-[#111111] border border-neutral-800 rounded-sm p-6 flex items-center">
                  <div className="w-14 h-14 rounded-full border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-center mr-5">
                    <Ticket className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-neutral-400 text-xs font-semibold mb-1">
                      Total Bookings
                    </div>
                    <div className="text-white font-extrabold text-3xl">03</div>
                  </div>
                </div>

                {/* Total Saved */}
                <div className="bg-[#111111] border border-neutral-800 rounded-md p-6 flex items-center">
                  <div className="w-14 h-14 rounded-full border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-center mr-5">
                    <Wallet className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-neutral-400 text-xs font-semibold mb-1">Total Saved</div>
                    <div className="text-white font-extrabold text-3xl">₹180</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Promo & History) */}
          <div className="lg:col-span-1 space-y-6 md:space-y-8">
            {/* Promo Card */}
            <div className="relative rounded-md overflow-hidden bg-[#111111] border border-neutral-800 flex flex-col justify-end p-6 min-h-55">
              {/* Background Image Setup */}
              <div className="absolute inset-0 z-0">
                <img
                  className="w-full h-full object-cover opacity-30"
                  alt="Gaming keyboard background"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFIKGeG2W9raLeDyuxdA9-PVKMcg3gGd30OuafHGO6cRvygZE1X1yb2QDWNvJMYIeuonRyPfymKfC69DyUaTfstYmffrR5GZR6zomB8a7o2dZn6pn_k-FJBA7lOD6wHKbh3uBhRSfZngbB2fq5-_XbFctoGCCoZdgmL9iQyXQ6cQEDm-tCNQSdiIlbRL4I6Z7lG8uvNQ4tnR_yDSF4sCCLZxiUR4GK80YjNc1I6hHuLGSx_TKeSVfzi1pZ23Q4htMWY6yGxtUHpQ"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#111111] via-[#111111]/80 to-transparent" />
              </div>

              <div className="relative z-10">
                <h3 className="text-white font-bold mb-2">Feeling Hungry?</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-5">
                  Elite members get 15% off on our Signature Gaming Menu.
                </p>
                <button className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-bold py-3 rounded-lg transition-colors text-sm">
                  Browse Food Menu
                </button>
              </div>
            </div>

            {/* Recent History Card */}
            <div className="bg-[#111111] border border-neutral-800 rounded-md p-6">
              <h3 className="text-sm font-bold text-white mb-6">Recent History</h3>

              <div className="space-y-6 mb-6">
                {/* History Item 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gamepad2 className="w-5 h-5 text-yellow-500 mr-4" />
                    <div>
                      <div className="text-white font-bold text-sm">3hr PS5 Solo</div>
                      <div className="text-neutral-500 text-xs mt-0.5">May 26, 2024</div>
                    </div>
                  </div>
                  <div className="text-yellow-500 font-bold text-sm">- ₹150</div>
                </div>

                {/* History Item 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Monitor className="w-5 h-5 text-yellow-500 mr-4" />
                    <div>
                      <div className="text-white font-bold text-sm">3hr PC Arena</div>
                      <div className="text-neutral-500 text-xs mt-0.5">May 25, 2024</div>
                    </div>
                  </div>
                  <div className="text-yellow-500 font-bold text-sm">- ₹150</div>
                </div>

                {/* History Item 3 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gamepad2 className="w-5 h-5 text-yellow-500 mr-4" />
                    <div>
                      <div className="text-white font-bold text-sm">3hr PS5 Solo</div>
                      <div className="text-neutral-500 text-xs mt-0.5">May 18, 2024</div>
                    </div>
                  </div>
                  <div className="text-yellow-500 font-bold text-sm">- ₹150</div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800/50 text-center">
                <button className="text-neutral-400 hover:text-white text-xs font-bold transition-colors">
                  View All History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Reference Section */}
        <div className="mt-12 pt-8 border-t border-neutral-800/50">
          <h3 className="text-sm font-bold text-neutral-500 mb-4">Status Reference</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Expiring Soon State */}
            <div className="bg-[#15120a] border border-yellow-900/30 rounded-md p-5 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-yellow-500/10 p-2.5 rounded-lg mr-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-neutral-200 font-bold text-sm mb-0.5">
                    Expiring Soon (Reference)
                  </div>
                  <div className="text-neutral-500 text-xs">Renews on June 07</div>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                2 Days Left
              </div>
            </div>

            {/* Expired State */}
            <div className="bg-[#111] border border-neutral-800 rounded-md p-5 flex items-center justify-between opacity-70">
              <div className="flex items-center">
                <div className="bg-neutral-800/50 p-2.5 rounded-lg mr-4">
                  <History className="w-5 h-5 text-neutral-500" />
                </div>
                <div>
                  <div className="text-neutral-300 font-bold text-sm mb-0.5">
                    Expired (Reference)
                  </div>
                  <div className="text-neutral-500 text-xs">Last active 30 days ago</div>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 text-neutral-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                Inactive
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
