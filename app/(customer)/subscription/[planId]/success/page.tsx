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
  const [isBookingSlot, setIsBookingSlot] = useState(false)
  const [isViewingDetails, setIsViewingDetails] = useState(false)
  const [isBrowsingFood, setIsBrowsingFood] = useState(false)

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
      <main className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--primary)]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-[#52525b] font-medium">Finalizing your activation...</p>
      </main>
    )
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#111115]">
        <p>Could not load subscription details.</p>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-[var(--background)] text-[#111115] font-sans relative overflow-hidden flex flex-col items-center  px-4 sm:px-6 lg:px-8 pt-5"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-200 h-150 bg-[var(--primary)]/5 rounded-full blur-[150px] pointer-events-none z-0" />

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
          <div className="w-24 h-24 mb-8 rounded-full bg-[var(--surface)] border border-[var(--primary)]/20 flex items-center justify-center shadow-[0_0_50px_rgba(184,134,11,0.15)] relative">
            <div className="absolute inset-0 rounded-full border border-[var(--primary)]/40 animate-ping opacity-20"></div>
            <CheckCircle2 className="w-12 h-12 text-[var(--primary)]" />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-[#111115] mb-4 tracking-tight">
            Subscription Activated!
          </h1>
          <p className="text-[#52525b] text-[15px] md:text-base max-w-lg mx-auto leading-relaxed">
            Your membership benefits are now active. Welcome to the inner circle of elite
            competitive gaming.
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {/* Left Column: Subscription Details */}
          <div className="lg:col-span-2 bg-[var(--surface)] border border-[#e4e4e7] rounded-md p-8 flex flex-col justify-between shadow-2xl glow-box-strong">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
              <div>
                <p className="text-xs font-bold text-[#52525b] uppercase tracking-wider mb-2">
                  Subscription ID
                </p>
                <p className="text-[var(--primary)] font-bold text-lg">{displaySubId}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#52525b] uppercase tracking-wider mb-2">
                  Current Plan
                </p>
                <p className="text-[var(--primary)] font-bold text-lg">{plan.name}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-[#52525b] uppercase tracking-wider mb-2">
                  Valid Until
                </p>
                <p className="text-[#111115] font-bold text-[17px]">{formatDate(plan.validity)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#52525b] uppercase tracking-wider mb-2">
                  Membership Status
                </p>
                <div className="flex items-center text-[var(--primary)] font-bold text-[17px]">
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)] mr-2 animate-pulse" />
                  Active & Secured
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--primary)]/20 rounded-md p-4 flex items-center glow-box-hover">
              <CheckCircle className="w-5 h-5 text-[var(--primary)] mr-3 shrink-0" />
              <p className="text-[#52525b] text-sm font-medium">
                Your {plan.discount_percentage}% elite discount has been applied to your membership
                summary.
              </p>
            </div>
          </div>

          {/* Right Column: Next Steps */}
          <div className="lg:col-span-1 bg-[var(--surface)] border border-[#e4e4e7] rounded-md p-8 flex flex-col shadow-2xl glow-box-hover">
            <h3 className="text-xl font-bold text-[#111115] mb-3">Next Steps</h3>
            <p className="text-[#52525b] text-sm leading-relaxed mb-8">
              Ready to dominate? Book your exclusive gaming slot at the arena now.
            </p>

            <div className="mt-auto space-y-3">
              <button
                onClick={() => {
                  setIsBookingSlot(true)
                  router.push("/booking")
                }}
                disabled={isBookingSlot || isViewingDetails || isBrowsingFood}
                className="w-full bg-[var(--primary)] uppercase hover:bg-[var(--primary-hover)] text-black font-bold text-[15px] py-4 rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(184,134,11,0.2)] hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isBookingSlot ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Gamepad2 className="w-5 h-5 mr-2" />
                )}
                Book Gaming Slot
              </button>

              <button
                onClick={() => {
                  setIsViewingDetails(true)
                  const phone = typeof window !== 'undefined' ? localStorage.getItem('customerPhone') : null
                  if (phone) {
                    router.push(`/my-subscription?phone=${phone}`)
                  } else {
                    router.push('/my-subscription')
                  }
                }}
                disabled={isBookingSlot || isViewingDetails || isBrowsingFood}
                className="w-full bg-transparent border border-[#e4e4e7] hover:border-[var(--primary)] text-[#111115] font-bold text-[15px] py-4 rounded-xl flex items-center justify-center transition-all hover:text-[var(--primary)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isViewingDetails ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 mr-2" />
                )}
                View Subscription Details
              </button>

              <button
                onClick={() => {
                  setIsBrowsingFood(true)
                  router.push("/food")
                }}
                disabled={isBookingSlot || isViewingDetails || isBrowsingFood}
                className="w-full text-[#52525b] hover:text-[#111115] font-medium text-sm py-3 mt-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isBrowsingFood ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                )}
                Browse Food Menu
              </button>
            </div>
          </div>
        </div>


      </div>
    </main>
  )
}
