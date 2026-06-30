'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { Percent, Gamepad2, Ticket, Wallet, Monitor, AlertTriangle, History, AlertCircle, Phone , Loader2 } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMyActiveSubscriptionByPhone } from './action'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function MySubscriptionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneFromUrl = searchParams.get('phone')

  const [phone, setPhone] = useState('')
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)
  const [isRenewing, setIsRenewing] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [isBrowsingPlans, setIsBrowsingPlans] = useState(false)
  const [isBrowsingFood, setIsBrowsingFood] = useState(false)

  const fetchSubscription = async (targetPhone: string) => {
    if (!targetPhone.trim() || targetPhone.length < 10) {
      toast.error('Invalid Phone', { description: 'Please enter a valid 10-digit mobile number.' })
      return
    }

    try {
      setIsLoading(true)
      setHasSearched(true)
      const response = await getMyActiveSubscriptionByPhone(targetPhone)
      if (response.success && response.data) {
        setSubscription(response.data)
      } else {
        setSubscription(null)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setSubscription(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initialPhone = phoneFromUrl || (typeof window !== 'undefined' ? localStorage.getItem('customerPhone') : null)
    if (initialPhone) {
      setPhone(initialPhone)
      fetchSubscription(initialPhone)
    } else {
      setIsLoading(false)
    }
  }, [phoneFromUrl])

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
      <main className="min-h-screen bg-[#0d0a14] flex flex-col items-center justify-center text-amber-500">
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
      className="min-h-screen bg-[#0d0a14] text-white font-sans relative overflow-hidden pt-5"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-[#0d0a14] to-[#0d0a14] pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-amber-500/10 rounded-full blur-[150px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-orange-600/10 to-primary/10 rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb */}
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'My Subscription' }]} />
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-[42px] font-black tracking-tight leading-tight mb-3 text-transparent bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text">
              Your Subscription
            </h1>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
              Manage your elite gaming access and monitor your exclusive benefits across the Break
              Point Arena ecosystem.
            </p>
          </div>
          <div className="flex flex-row gap-3 md:gap-4 shrink-0">
            {subscription && (
              <button
                onClick={() => {
                  setIsRenewing(true)
                  router.push(`/subscription/${subscription.plan_id || subscription.plan?.id}`)
                }}
                disabled={isRenewing || isBooking}
                className="flex-1 md:flex-none bg-transparent border-2 border-primary hover:bg-primary/10 text-primary font-black py-3 px-6 rounded-xl transition-all text-sm uppercase tracking-wider hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] flex items-center justify-center gap-2"
              >
                {isRenewing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Renew Now"}
              </button>
            )}
            <button
              onClick={() => {
                setIsBooking(true)
                router.push('/booking')
              }}
              disabled={isRenewing || isBooking}
              className="flex-1 md:flex-none bg-gradient-to-r from-primary via-amber-400 to-primary text-black font-black py-3 px-6 rounded-xl transition-all text-sm shadow-[0_0_20px_rgba(255,193,7,0.3)] hover:shadow-[0_0_40px_rgba(255,193,7,0.5)] hover:scale-[1.02] uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {isBooking ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : "Book Slot"}
            </button>
          </div>
        </div>

        {/* Search screen if not subscribed */}
        {!subscription ? (
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Search Card */}
            <Card className="bg-[#111] border border-zinc-900 p-6 shadow-xl rounded-2xl glow-box-hover">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search-phone" className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-zinc-600" /> MOBILE NUMBER
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 border-r border-zinc-900 pr-2">+91</span>
                      <Input
                        id="search-phone"
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && fetchSubscription(phone)}
                        className="bg-zinc-950 border-zinc-900 h-12 pl-12 text-sm text-white focus-visible:ring-primary font-mono tracking-wide"
                      />
                    </div>
                    <Button
                      onClick={() => fetchSubscription(phone)}
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary-hover text-black font-black uppercase text-xs h-12 px-6 rounded-xl"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SEARCH"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {hasSearched ? (
              /* EMPTY STATE: If searched and user has no active subscription */
              <div className="bg-[#111111] border border-neutral-800 rounded-md p-10 text-center flex flex-col items-center glow-box-hover animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-neutral-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Active Subscription</h3>
                <p className="text-neutral-400 text-sm max-w-md mb-6">
                  No active membership found for +91 {phone}. Subscribe to unlock elite benefits and arena discounts.
                </p>
                <button
                  onClick={() => {
                    setIsBrowsingPlans(true)
                    router.push('/subscription')
                  }}
                  disabled={isBrowsingPlans}
                  className="bg-primary hover:bg-primary-hover text-black font-black uppercase py-3 px-8 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isBrowsingPlans ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : "Browse Plans"}
                </button>
              </div>
            ) : (
              /* WELCOME STATE: Before searching */
              <div className="bg-[#111111] border border-neutral-800 rounded-md p-10 text-center flex flex-col items-center glow-box-hover animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                  <Gamepad2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">View Your Benefits</h3>
                <p className="text-neutral-400 text-sm max-w-md mb-6">
                  Enter your mobile number above to retrieve your active membership details and access elite arena rewards.
                </p>
                <button
                  onClick={() => {
                    setIsBrowsingPlans(true)
                    router.push('/subscription')
                  }}
                  disabled={isBrowsingPlans}
                  className="bg-primary hover:bg-primary-hover text-black font-black uppercase py-3 px-8 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isBrowsingPlans ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : "Browse Plans"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Main Dashboard Layout if subscribed */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">

            {/* Left Column (Main Subscription & Savings) */}
            <div className="lg:col-span-2 space-y-8">

              {/* DYNAMIC ACTIVE SUBSCRIPTION CARD */}
              <div className="bg-gradient-to-br from-zinc-900 via-[#131313] to-zinc-900 border border-primary/30 rounded-xl p-6 md:p-8 relative overflow-hidden group glow-box-strong">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-amber-400/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Scan line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

                {/* Card Header */}
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <h3 className="text-primary text-xs font-black tracking-[0.2em] uppercase mb-2 drop-shadow-[0_0_10px_rgba(255,193,7,0.3)]">
                      Elite Membership
                    </h3>
                    <h2 className="text-2xl md:text-3xl font-black text-transparent bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text">
                      {subscription.plan?.name || 'Unknown Plan'}
                    </h2>
                  </div>
                  <div className="bg-gradient-to-r from-green-900/30 to-green-950/30 border border-green-500/30 rounded-full px-4 py-2 flex items-center shadow-[0_0_20px_rgba(34,197,94,0.2)] backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse"></div>
                    <span className="text-green-400 text-xs font-black tracking-wider uppercase">
                      Active
                    </span>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="mb-8 relative z-10">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <div className="text-zinc-500 text-xs font-black uppercase tracking-wider mb-2">
                        Validity Status
                      </div>
                      <div className="text-white font-black text-lg">
                        Valid until {formatDate(subscription.end_date)}{' '}
                        <span className="text-transparent bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-sm ml-1">
                          ({daysRemaining} days remaining)
                        </span>
                      </div>
                    </div>
                    <div className="text-zinc-500 text-xs font-black uppercase tracking-wider">{progressPercentage}% Complete</div>
                  </div>
                  {/* Bar with gaming effect */}
                  <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-zinc-800 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-primary via-amber-400 to-primary h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      {/* Animated shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>

                {/* Perks Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-primary/20 rounded-xl p-4 flex items-center group/card hover:border-primary/40 hover:shadow-[0_0_20px_rgba(255,193,7,0.1)] transition-all duration-300 glow-box-hover">
                    <div className="bg-gradient-to-br from-primary/20 to-amber-500/20 p-3 rounded-lg mr-4 shadow-[0_0_15px_rgba(255,193,7,0.2)]">
                      <Percent className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(255,193,7,0.5)]" />
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
                        Loyalty Discount
                      </div>
                      <div className="text-transparent bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text font-black text-lg drop-shadow-[0_0_10px_rgba(255,193,7,0.3)]">
                        {subscription.plan?.discount_percentage || 0}% OFF
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-4 flex items-center glow-box-hover">
                    <div className="bg-amber-500/10 p-3 rounded-sm mr-4">
                      <Gamepad2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-neutral-400 text-xs font-semibold mb-0.5">Arena Pass</div>
                      <div className="text-white font-extrabold text-lg">All Access</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Section (Kept static for now, connect to a bookings API later) */}
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Your Savings So Far</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Total Bookings */}
                  <div className="bg-[#111111] border border-neutral-800 rounded-sm p-6 flex items-center glow-box-hover">
                    <div className="w-14 h-14 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center mr-5">
                      <Ticket className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-neutral-400 text-xs font-semibold mb-1">
                        Total Bookings
                      </div>
                      <div className="text-white font-extrabold text-3xl">03</div>
                    </div>
                  </div>

                  {/* Total Saved */}
                  <div className="bg-[#111111] border border-neutral-800 rounded-md p-6 flex items-center glow-box-hover">
                    <div className="w-14 h-14 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center mr-5">
                      <Wallet className="w-6 h-6 text-amber-500" />
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
                    Elite members get {subscription.plan?.discount_percentage || 15}% off on our Signature Gaming Menu.
                  </p>
                  <button
                    onClick={() => {
                      setIsBrowsingFood(true)
                      router.push('/food')
                    }}
                    disabled={isBrowsingFood}
                    className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-neutral-700 text-white font-bold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {isBrowsingFood ? <Loader2 className="w-4 h-4 animate-spin" /> : "Browse Food Menu"}
                  </button>
                </div>
              </div>

              {/* Recent History Card */}
              <div className="bg-[#111111] border border-neutral-800 rounded-md p-6 glow-box-hover">
                <h3 className="text-sm font-bold text-white mb-6">Recent History</h3>

                <div className="space-y-6 mb-6">
                  {/* History Item 1 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Gamepad2 className="w-5 h-5 text-amber-500 mr-4" />
                      <div>
                        <div className="text-white font-bold text-sm">3hr PS5 Solo</div>
                        <div className="text-neutral-500 text-xs mt-0.5">May 26, 2026</div>
                      </div>
                    </div>
                    <div className="text-amber-500 font-bold text-sm">- ₹150</div>
                  </div>

                  {/* History Item 2 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Monitor className="w-5 h-5 text-amber-500 mr-4" />
                      <div>
                        <div className="text-white font-bold text-sm">3hr PC Arena</div>
                        <div className="text-neutral-500 text-xs mt-0.5">May 25, 2026</div>
                      </div>
                    </div>
                    <div className="text-amber-500 font-bold text-sm">- ₹150</div>
                  </div>

                  {/* History Item 3 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Gamepad2 className="w-5 h-5 text-amber-500 mr-4" />
                      <div>
                        <div className="text-white font-bold text-sm">3hr PS5 Solo</div>
                        <div className="text-neutral-500 text-xs mt-0.5">May 18, 2026</div>
                      </div>
                    </div>
                    <div className="text-amber-500 font-bold text-sm">- ₹150</div>
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
        )}

        {/* Status Reference Section */}
        <div className="mt-12 pt-8 border-t border-neutral-800/50">
          <h3 className="text-sm font-bold text-neutral-500 mb-4">Status Reference</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Expiring Soon State */}
            <div className="bg-[#15120a] border border-purple-900/30 rounded-md p-5 flex items-center justify-between glow-box-hover">
              <div className="flex items-center">
                <div className="bg-amber-500/10 p-2.5 rounded-lg mr-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-neutral-200 font-bold text-sm mb-0.5">
                    Expiring Soon (Reference)
                  </div>
                  <div className="text-neutral-500 text-xs">Renews on June 07</div>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
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

export default function MySubscriptionPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <MySubscriptionPageContent />
    </Suspense>
  );
}
