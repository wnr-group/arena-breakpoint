'use client'

import React, { useEffect, useState } from 'react'
import { Percent, Gamepad2, Ticket, Wallet, Monitor, AlertTriangle, History, Loader2, AlertCircle } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useRouter } from 'next/navigation'
import { getMyActiveSubscription } from './action'


export default function MySubscriptionPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoading(true)
        const mockCustomerId = "e9355243-1ce2-4543-a6f3-f2587da4e6ab" 
        
        const response = await getMyActiveSubscription(mockCustomerId)
        if (response.success && response.data) {
          setSubscription(response.data)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  // Helper to format dates like "June 07"
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
    })
  }

  // Loading State
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-yellow-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-neutral-400 font-medium">Loading your arena pass...</p>
      </main>
    )
  }

  // Calculate dynamic progress values if subscription exists
  let daysRemaining = 0
  let progressPercentage = 0

  if (subscription) {
    const today = new Date()
    const endDate = new Date(subscription.end_date)
    const startDate = new Date(subscription.start_date)

    // Calculate days
    daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)))
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
    
    // Calculate progress (how much time has elapsed)
    if (totalDays > 0) {
      progressPercentage = Math.min(100, Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100)))
    }
  }

  return (
    <main
      className="min-h-screen bg-[#0a0a0a] text-white font-sans "
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
            
            {subscription ? (
              /* DYNAMIC ACTIVE SUBSCRIPTION CARD */
              <div className="bg-[#111111] border border-neutral-800 rounded-md p-6 md:p-8">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-yellow-500 text-xs font-bold tracking-widest uppercase mb-1">
                      Elite Membership
                    </h3>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                      {subscription.plan.name}
                    </h2>
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
                        Valid until {formatDate(subscription.end_date)}{' '}
                        <span className="text-yellow-500 text-sm ml-1">
                          ({daysRemaining} days remaining)
                        </span>
                      </div>
                    </div>
                    <div className="text-neutral-400 text-xs font-bold">{progressPercentage}% Complete</div>
                  </div>
                  {/* Bar */}
                  <div className="w-full bg-[#222222] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-yellow-600 to-yellow-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercentage}%` }}
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
                      <div className="text-white font-extrabold text-lg">
                        {subscription.plan.discount_percentage}% OFF
                      </div>
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
            ) : (
              /* EMPTY STATE: If user has no active subscription */
              <div className="bg-[#111111] border border-neutral-800 rounded-md p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-neutral-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Active Subscription</h3>
                <p className="text-neutral-400 text-sm max-w-md mb-6">
                  You currently don't have an active membership. Subscribe to unlock elite benefits and arena discounts.
                </p>
                <button 
                  onClick={() => router.push('/customer/subscription')}
                  className="bg-[#FFD700] hover:bg-[#F2C900] text-black font-bold py-3 px-8 rounded-lg transition-colors text-sm"
                >
                  Browse Plans
                </button>
              </div>
            )}

            {/* Savings Section (Kept static for now, connect to a bookings API later) */}
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
                  Elite members get {subscription?.plan.discount_percentage || 15}% off on our Signature Gaming Menu.
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
                      <div className="text-neutral-500 text-xs mt-0.5">May 26, 2026</div>
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
                      <div className="text-neutral-500 text-xs mt-0.5">May 25, 2026</div>
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
                      <div className="text-neutral-500 text-xs mt-0.5">May 18, 2026</div>
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