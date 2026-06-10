'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { toast } from 'sonner'

// Import BOTH of your server actions
import { getSubscriptionPlanDetails } from '@/app/(admin)/admin/subscription/actions'
import { activateSubscriptionPlan } from './action'

export default function PlanDetailsPage() {
  const router = useRouter()
  const params = useParams()

  const [plan, setPlan] = useState<any>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isActivating, setIsActivating] = useState(false)

  // Fetch the plan data on mount
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setIsLoading(true)
        const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId

        if (planId) {
          const response = await getSubscriptionPlanDetails(planId)
          if (response.success && response.data) {
            setPlan(response.data)
          } else {
            console.error('Failed to load plan:', response.message)
          }
        }
      } catch (error) {
        console.error('Error fetching plan:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()
  }, [params.planId])


  // The direct Server Action handler for Activation
  const handleActivatePlan = async () => {
    try {
      setIsActivating(true)
      const mockCustomerId = 'e9355243-1ce2-4543-a6f3-f2587da4e6ab'
      const mockPaymentId = `pay_mock_${Math.floor(Math.random() * 10000)}`

      const result = await activateSubscriptionPlan({
        customerId: mockCustomerId,
        planId: plan.id,
        paymentId: mockPaymentId,
      })

      if (result.success) {
        toast.success('Plan Activated!', {
          description: 'Your subscription has been activated successfully.'
        })
        router.push(`/subscription/${params.planId}/success`)
      } else {
        toast.error('Activation Failed', {
          description: result.message || 'Failed to activate plan'
        })
        setIsActivating(false)
      }
    } catch (error) {
      console.error('Activation error:', error)
      toast.error('Activation Error', {
        description: 'Something went wrong during activation.'
      })
      setIsActivating(false)
    }
  }

  // Format the ISO date to a readable format
  const formatDate = (isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    })
  }

  // Render full-page loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center text-yellow-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-neutral-400 font-medium">Loading plan details...</p>
      </main>
    )
  }

  // Render error state if plan doesn't exist
  if (!plan) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Plan not found.</p>
      </main>
    )
  }

  // Parse features from description or use fallbacks
  const features = plan.description
    ? plan.description.split(',').map((f: string) => f.trim())
    : ['Standard Arena Access']

  // Determine Duration text
  const durationText = plan.duration_months
    ? `${plan.duration_months} Month${plan.duration_months > 1 ? 's' : ''}`
    : `${plan.duration_days || 30} Days`

  return (
    <main className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-black to-black pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-primary/15 to-yellow-500/15 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] bg-gradient-to-r from-amber-500/10 to-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb */}
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Subscriptions', href: '/subscription' },
              { label: plan.name },
            ]}
          />
        </div>

        {/* Page Title */}
        <h1 className="text-3xl md:text-[42px] font-black tracking-tight mb-8 text-transparent bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Subscribe to {plan.name}
        </h1>

        {/* Main Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column (Details & Form) */}
          <div className="w-full lg:w-2/3 space-y-6">
            {/* Unified Plan Details Card */}
            <div className="bg-gradient-to-br from-zinc-900 via-[#131313] to-zinc-900 border border-primary/20 rounded-xl p-6 md:p-8 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-yellow-400/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative z-10">
                <div className="flex flex-col">
                  <span className="text-zinc-500 text-sm font-bold mb-2 uppercase tracking-wider">Duration</span>
                  <span className="text-transparent bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-xl md:text-[22px] font-black tracking-tight">
                    {durationText}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-zinc-500 text-sm font-bold mb-2 uppercase tracking-wider">Valid Until</span>
                  <span className="text-transparent bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-xl md:text-[22px] font-black tracking-tight leading-tight">
                    {formatDate(plan.validity)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-zinc-500 text-sm font-bold mb-2 uppercase tracking-wider">Discount</span>
                  <span className="text-transparent bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-xl md:text-[22px] font-black tracking-tight drop-shadow-[0_0_10px_rgba(255,193,7,0.3)]">
                    {plan.discount_percentage}%
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-zinc-500 text-sm font-bold mb-2 uppercase tracking-wider">Price</span>
                  <span className="text-transparent bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-xl md:text-[22px] font-black tracking-tight">
                    ₹{plan.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Elite Benefits */}
              <div className="bg-gradient-to-br from-zinc-900 via-[#131313] to-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 relative overflow-hidden group animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <h3 className="text-lg font-black text-transparent bg-gradient-to-r from-white to-zinc-300 bg-clip-text mb-6 uppercase tracking-tight">Elite Benefits</h3>
                <ul className="space-y-4">
                  {features.map((benefit: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start text-[14px] md:text-[15px] font-medium text-zinc-300 leading-tight hover:text-white transition-colors duration-300"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(255,193,7,0.4)]" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Savings Box */}
              <div className="bg-gradient-to-br from-zinc-900 via-[#131313] to-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 flex flex-col relative overflow-hidden group animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <h3 className="text-lg font-black text-transparent bg-gradient-to-r from-white to-zinc-300 bg-clip-text mb-6 uppercase tracking-tight">Pro Savings</h3>

                <div className="bg-zinc-950 border border-primary/20 rounded-xl p-5 flex justify-between items-center mb-6 group/savings hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,193,7,0.1)]">
                  <div>
                    <div className="text-white font-bold text-sm md:text-base">PS5 Pro Booking</div>
                    <div className="text-zinc-500 text-xs md:text-sm font-medium mt-1">
                      Standard Session
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-500 line-through text-xs md:text-sm font-medium mb-0.5">
                      ₹300
                    </div>
                    <div className="text-transparent bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text font-black text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(255,193,7,0.3)]">
                      ₹{Math.round(300 - 300 * (plan.discount_percentage / 100))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto text-center">
                  <p className="text-neutral-400 text-sm italic font-medium">
                    "Recover your plan cost in just a few sessions!"
                  </p>
                </div>
              </div>
            </div>

            {/* Subscriber Details Form */}
            
          </div>

          {/* Right Column (Order Summary) */}
          <div className="w-full lg:w-1/3">
            <div className="bg-gradient-to-br from-zinc-900 via-[#131313] to-zinc-900 border border-primary/20 rounded-xl p-6 md:p-8 sticky top-8 relative overflow-hidden group animate-in fade-in slide-in-from-right-4 duration-700 delay-400">
              {/* Animated border glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-yellow-400/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />

              {/* Scan line effect */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

              <h3 className="text-xl font-black text-transparent bg-gradient-to-r from-white to-zinc-300 bg-clip-text mb-6 border-b border-zinc-800 pb-4 uppercase tracking-tight relative z-10">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-zinc-200 font-bold text-[15px]">{plan.name}</div>
                    <div className="text-zinc-500 text-xs mt-1 font-medium">{durationText} Membership</div>
                  </div>
                  <div className="text-white font-black">₹{plan.price}</div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-zinc-500 text-sm font-medium">GST (Included)</div>
                  <div className="text-zinc-400 text-sm font-medium">₹0</div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-5 mb-8 relative z-10">
                <div className="flex justify-between items-end">
                  <div className="text-white font-black text-lg uppercase tracking-tight">Total Amount</div>
                  <div className="text-transparent bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text font-black text-3xl drop-shadow-[0_0_15px_rgba(255,193,7,0.4)]">₹{plan.price}</div>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                {/* Submit Button with gaming effects */}
                <button
                  onClick={handleActivatePlan}
                  disabled={isActivating}
                  className="w-full bg-gradient-to-r from-primary via-yellow-400 to-primary text-black font-black py-4 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(255,193,7,0.3)] hover:shadow-[0_0_50px_rgba(255,193,7,0.5)] hover:scale-[1.02] text-[15px] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 uppercase tracking-wider relative overflow-hidden group/btn"
                >
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />

                  {isActivating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin relative z-10" />
                      <span className="relative z-10">Activating...</span>
                    </>
                  ) : (
                    <span className="relative z-10">Pay & Activate</span>
                  )}
                </button>
                <button
                  onClick={() => router.back()}
                  disabled={isActivating}
                  className="w-full bg-transparent border-2 border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/50 font-black py-4 rounded-xl transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider hover:shadow-[0_0_20px_rgba(255,193,7,0.1)]"
                >
                  Back to Plans
                </button>
              </div>

              <div className="flex items-center justify-center mt-6 text-zinc-600 space-x-2 relative z-10">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">256-bit Encrypted Payment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Image Banner */}
        <div className="mt-12 md:mt-16 w-full rounded-3xl overflow-hidden relative border border-neutral-800 bg-black min-h-75 flex items-center p-8 md:p-16">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFIKGeG2W9raLeDyuxdA9-PVKMcg3gGd30OuafHGO6cRvygZE1X1yb2QDWNvJMYIeuonRyPfymKfC69DyUaTfstYmffrR5GZR6zomB8a7o2dZn6pn_k-FJBA7lOD6wHKbh3uBhRSfZngbB2fq5-_XbFctoGCCoZdgmL9iQyXQ6cQEDm-tCNQSdiIlbRL4I6Z7lG8uvNQ4tnR_yDSF4sCCLZxiUR4GK80YjNc1I6hHuLGSx_TKeSVfzi1pZ23Q4htMWY6yGxtUHpQ"
            alt="Gaming Setup Background"
            className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-transparent" />

          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              The Arena Awaits Your Command.
            </h2>
            <p className="text-neutral-300 text-sm md:text-base font-medium leading-relaxed">
              Unlock the full potential of your gaming performance with professional-grade gear and
              priority access.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
