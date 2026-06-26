'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle2,
  CheckCircle,
  Gamepad2,
  FileText,
  UtensilsCrossed,
  Wifi,
  Award,
  Armchair,
  Loader2,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'

// Import your existing server action
import { getSubscriptionPlanDetails } from '@/app/(admin)/admin/subscription/actions'
import Link from 'next/link'

export default function SubscriptionActivatedPage() {
  const router = useRouter()
  const params = useParams()

  const [plan, setPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  // Format the ISO date to a readable format (e.g., "June 07, 2026")
  const formatDate = (isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    })
  }

  // Generate a display ID for the UI (In a full production app, you might pass the real ID via URL query params)
  const displaySubId = `SUB-${Math.floor(Math.random() * 90000) + 10000}`

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0d0a14] flex flex-col items-center justify-center text-amber-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-neutral-400 font-medium">Finalizing your activation...</p>
      </main>
    )
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-[#0d0a14] flex items-center justify-center text-white">
        <p>Could not load subscription details.</p>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-[#0d0a14] text-white font-sans relative overflow-hidden flex flex-col items-center  px-4 sm:px-6 lg:px-8"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-200 h-150 bg-amber-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="max-w-275 w-full relative z-10">
        {/* Breadcrumb perfectly left-aligned at the top of the content container */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Subscriptions', href: '/customer/subscription' },
            { label: plan.name, href: `/customer/subscription/${plan.id}` },
            { label: 'Success' },
          ]}
        />

        {/* Success Header */}
        <div className="flex flex-col items-center text-center mb-16 mt-4 md:mt-8">
          <div className="w-24 h-24 mb-8 rounded-full bg-[#131313] border border-amber-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(255,193,7,0.15)] relative">
            <div className="absolute inset-0 rounded-full border border-amber-500/40 animate-ping opacity-20"></div>
            <CheckCircle2 className="w-12 h-12 text-amber-500" />
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
          <div className="lg:col-span-2 bg-[#131313] border border-neutral-800 rounded-md p-8 flex flex-col justify-between shadow-2xl glow-box-strong">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Subscription ID
                </p>
                <p className="text-amber-500 font-bold text-lg">{displaySubId}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Current Plan
                </p>
                <p className="text-amber-500 font-bold text-lg">{plan.name}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Valid Until
                </p>
                <p className="text-white font-bold text-[17px]">{formatDate(plan.validity)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Membership Status
                </p>
                <div className="flex items-center text-amber-500 font-bold text-[17px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse" />
                  Active & Secured
                </div>
              </div>
            </div>

            <div className="bg-[#1a1810] border border-amber-500/20 rounded-md p-4 flex items-center glow-box-hover">
              <CheckCircle className="w-5 h-5 text-amber-500 mr-3 shrink-0" />
              <p className="text-neutral-300 text-sm font-medium">
                Your {plan.discount_percentage}% elite discount has been applied to your membership
                summary.
              </p>
            </div>
          </div>

          {/* Right Column: Next Steps */}
          <div className="lg:col-span-1 bg-[#131313] border border-neutral-800 rounded-md p-8 flex flex-col shadow-2xl glow-box-hover">
            <h3 className="text-xl font-bold text-white mb-3">Next Steps</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8">
              Ready to dominate? Book your exclusive gaming slot at the arena now.
            </p>

            <div className="mt-auto space-y-3">
              <Link
                href="/booking"
                className="w-full bg-[#A855F7] uppercase hover:bg-[#9333EA] text-black font-bold text-[15px] py-4 rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(255,193,7,0.2)] hover:scale-[1.02]"
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                Book Gaming Slot
              </Link>

              <button
                onClick={() => {
                  const phone = typeof window !== 'undefined' ? localStorage.getItem('customerPhone') : null
                  if (phone) {
                    router.push(`/my-subscription?phone=${phone}`)
                  } else {
                    router.push('/my-subscription')
                  }
                }}
                className="w-full bg-transparent border border-neutral-700 hover:border-amber-500 text-white font-bold text-[15px] py-4 rounded-xl flex items-center justify-center transition-all hover:text-amber-500"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Subscription Details
              </button>

              <Link href="/food" className="w-full text-neutral-400 hover:text-white font-medium text-sm py-3 mt-2 flex items-center justify-center transition-colors">
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Browse Food Menu
              </Link>
            </div>
          </div>
        </div>

        {/* Elite Perks Section */}
        <div className="pt-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-10 tracking-tight">
            Your Elite Perks are Live
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#131313] border border-neutral-800 rounded-md p-8 transition-transform hover:-translate-y-1 hover:border-neutral-700 glow-box-hover">
              <Wifi className="w-6 h-6 text-amber-500 mb-6" />
              <h4 className="text-lg font-bold text-white mb-3">Ultra-Low Latency</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Priority routing for your sessions ensures the fastest response times in the arena.
              </p>
            </div>

            <div className="bg-[#131313] border border-neutral-800 rounded-md p-8 transition-transform hover:-translate-y-1 hover:border-neutral-700 glow-box-hover">
              <Award className="w-6 h-6 text-amber-500 mb-6" />
              <h4 className="text-lg font-bold text-white mb-3">Pro Gear Access</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Exclusive access to high-end mechanical peripherals and ergonomic seating reserved
                for pros.
              </p>
            </div>

            <div className="bg-[#131313] border border-neutral-800 rounded-md p-8 transition-transform hover:-translate-y-1 hover:border-neutral-700 glow-box-hover">
              <Armchair className="w-6 h-6 text-amber-500 mb-6" />
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
