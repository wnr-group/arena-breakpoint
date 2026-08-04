'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, ShieldCheck, Phone, User, Mail, Cake, ChevronRight , Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { BreakpointLoader } from '@/components/shared/BreakpointLoader'
import { toast } from 'sonner'
import { formatDateForDB, formatDateForDisplay, handleDobInput, isValidDateDDMMYYYY } from '@/lib/utils/dates'

// Import server actions
import { getSubscriptionPlanDetails } from '@/app/(admin)/admin/subscription/actions'
import { activateSubscriptionPlan } from './action'
import { checkCustomerExists } from '@/app/(customer)/booking/actions'

type Step = 'phone' | 'details' | 'summary' | 'processing'

export default function PlanDetailsPage() {
  const router = useRouter()
  const params = useParams()

  const [plan, setPlan] = useState<any>(null)
  const [step, setStep] = useState<Step>('phone')

  // Customer data
  const [mobileNumber, setMobileNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerDob, setCustomerDob] = useState('')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerExists, setCustomerExists] = useState(false)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
            toast.error('Plan Not Found', {
              description: 'Unable to load subscription plan details'
            })
            router.push('/subscription')
          }
        }
      } catch (error) {
        console.error('Error fetching plan:', error)
        toast.error('Error', { description: 'Failed to load plan' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()
  }, [params.planId, router])

  // Handle phone submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      toast.error('Invalid Number', { description: 'Please enter a valid 10-digit mobile number.' })
      return
    }

    setIsSubmitting(true)

    // Check if customer exists
    const result = await checkCustomerExists(mobileNumber)

    if (result.exists && result.customer) {
      // Check if already subscribed to this plan
      if (result.subscription) {
        if (String(result.subscription.plan_id) === String(plan.id)) {
          toast.error('Already Subscribed', {
            description: `You already have an active subscription to ${plan.name} (valid until ${new Date(result.subscription.end_date).toLocaleDateString()}).`
          })
          setIsSubmitting(false)
          return
        } else {
          toast.warning('Active Subscription Found', {
            description: `You already have an active subscription to ${result.subscription.plan_name} (valid until ${new Date(result.subscription.end_date).toLocaleDateString()}).`
          })
        }
      }

      // Customer exists
      setCustomerExists(true)
      setCustomerId(result.customer.id)
      setCustomerName(result.customer.name)
      setCustomerEmail(result.customer.email || '')
      if (result.customer.date_of_birth) {
        setCustomerDob(formatDateForDisplay(result.customer.date_of_birth))
      }

      toast.success('Welcome back!', { description: `Hey ${result.customer.name}!` })
      setStep('summary')
    } else {
      // New customer
      toast.info('New Customer', { description: 'Please provide your details.' })
      setStep('details')
    }

    setIsSubmitting(false)
  }

  // Handle details submission
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toast.error('Required Field', { description: 'Please provide your name.' })
      return
    }

    if (!customerDob || !isValidDateDDMMYYYY(customerDob)) {
      toast.error('Invalid Date of Birth', { description: 'Please enter a valid date in DD-MM-YYYY format.' })
      return
    }

    toast.success('Details Saved', { description: 'Review your purchase.' })
    setStep('summary')
  }

  // Handle plan activation
  const handleActivatePlan = async () => {
    try {
      setIsActivating(true)
      const mockPaymentId = `pay_mock_${Math.floor(Math.random() * 10000)}`

      const result = await activateSubscriptionPlan({
        phone: mobileNumber,
        name: customerName,
        email: customerEmail,
        date_of_birth: customerDob ? formatDateForDB(customerDob) : undefined,
        planId: plan.id,
        paymentId: mockPaymentId,
      })

      if (result.success) {
        toast.success('Plan Activated!', {
          description: 'Your subscription has been activated successfully.'
        })
        if (typeof window !== 'undefined') {
          localStorage.setItem('customerPhone', mobileNumber)
        }
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

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = handleDobInput(e.target.value)
    setCustomerDob(formatted)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <BreakpointLoader size="lg" />
      </div>
    )
  }

  if (!plan) {
    return null
  }

  // Phone Step
  if (step === 'phone') {
    return (
      <div className="min-h-screen bg-white text-[#111115] py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="bg-[#f4f4f5] border border-[#e4e4e7] p-6 shadow-2xl rounded-2xl space-y-6 glow-box-hover">
            <div className="border-b border-[#e4e4e7] pb-4">
              <h3 className="text-lg font-black uppercase text-[#111115] tracking-tight">Purchase {plan.name}</h3>
              <p className="text-xs text-[#52525b] font-medium mt-1">Enter your mobile number to continue</p>
            </div>

            {/* Plan Summary */}
            <div className="bg-white p-4 rounded-xl border border-[#e4e4e7] space-y-2 glow-box-strong">
              <div className="flex justify-between text-sm">
                <span className="text-[#52525b]">Plan:</span>
                <span className="text-[#111115] font-bold">{plan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#52525b]">Duration:</span>
                <span className="text-[#111115] font-bold">{plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#52525b]">Discount:</span>
                <span className="text-primary font-bold">{plan.discount_percentage}% off bookings</span>
              </div>
              <div className="flex justify-between text-base border-t border-[#e4e4e7] pt-2 font-black">
                <span className="text-[#111115]">Amount:</span>
                <span className="text-primary text-lg">₹{plan.price}</span>
              </div>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[11px] font-black text-[#52525b] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-[#52525b]" /> MOBILE NUMBER <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#52525b] border-r border-[#e4e4e7] pr-2">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit phone number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="bg-white border-[#e4e4e7] h-12 pl-12 text-sm text-[#111115] focus-visible:ring-primary font-mono tracking-wide"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button variant="gradient" type="submit" disabled={isSubmitting || mobileNumber.length < 10} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CONTINUE'} <ChevronRight className="h-4 w-4 stroke-[3]" />
                </Button>
                <Button type="button" onClick={() => router.back()} variant="ghost" className="w-full border border-[#e4e4e7] text-[#52525b] hover:text-[#3f3f46] font-bold uppercase text-[11px] h-11 rounded-xl">
                  ← BACK TO PLANS
                </Button>
              </div>
            </form>

            <div className="pt-2 flex gap-2 items-center text-[10px] text-[#52525b] justify-center border-t border-[#e4e4e7]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#52525b]" />
              <span>Your data is stored securely</span>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Details Step (for new customers)
  if (step === 'details') {
    return (
      <div className="min-h-screen bg-white text-[#111115] py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="bg-[#f4f4f5] border border-[#e4e4e7] p-6 shadow-2xl rounded-2xl space-y-6 glow-box-hover">
            <div className="border-b border-[#e4e4e7] pb-4">
              <h3 className="text-lg font-black uppercase text-[#111115] tracking-tight">Customer Details</h3>
              <p className="text-xs text-[#52525b] font-medium mt-1">Please provide your information</p>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[11px] font-black text-[#52525b] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3 w-3 text-[#52525b]" /> FULL NAME <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white border-[#e4e4e7] h-12 text-sm text-[#111115] focus-visible:ring-primary"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-black text-[#52525b] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-[#52525b]" /> EMAIL ADDRESS
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email (optional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="bg-white border-[#e4e4e7] h-12 text-sm text-[#111115] focus-visible:ring-primary"
                />
              </div>

              {/* DOB */}
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-[11px] font-black text-[#52525b] uppercase tracking-wider flex items-center gap-1.5">
                  <Cake className="h-3 w-3 text-[#52525b]" /> DATE OF BIRTH <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dob"
                  type="text"
                  required
                  placeholder="DD-MM-YYYY"
                  value={customerDob}
                  onChange={handleDobChange}
                  maxLength={10}
                  className="bg-white border-[#e4e4e7] h-12 text-sm text-[#111115] focus-visible:ring-primary font-mono tracking-wide"
                />
              </div>

              <div className="pt-4 space-y-2">
                <Button variant="gradient" type="submit" disabled={!customerName.trim() || !customerDob || !isValidDateDDMMYYYY(customerDob)} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl">
                  CONTINUE <ChevronRight className="h-4 w-4 ml-1 stroke-[3]" />
                </Button>
                <Button type="button" onClick={() => setStep('phone')} variant="ghost" className="w-full border border-[#e4e4e7] text-[#52525b] hover:text-[#3f3f46] font-bold uppercase text-[11px] h-11 rounded-xl">
                  ← BACK
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  // Summary Step
  if (step === 'summary') {
    return (
      <div className="min-h-screen bg-white text-[#111115] py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="bg-[#f4f4f5] border border-[#e4e4e7] p-6 shadow-2xl rounded-2xl space-y-6 glow-box-hover">
            <div className="border-b border-[#e4e4e7] pb-4">
              <h3 className="text-lg font-black uppercase text-[#111115] tracking-tight">Purchase Summary</h3>
              <p className="text-xs text-[#52525b] font-medium mt-1">Review your subscription details</p>
            </div>

            {/* Customer Info */}
            <div className="bg-white p-4 rounded-xl border border-[#e4e4e7] space-y-3 glow-box-hover">
              <h4 className="text-[10px] font-black text-[#52525b] uppercase tracking-wider mb-2">Customer Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#52525b]">Name:</span>
                  <span className="text-[#111115] font-bold">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525b]">Phone:</span>
                  <span className="text-primary font-bold">+91 {mobileNumber}</span>
                </div>
                {customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-[#52525b]">Email:</span>
                    <span className="text-[#111115] font-bold text-right truncate ml-4">{customerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Details */}
            <div className="bg-white p-4 rounded-xl border border-[#e4e4e7] space-y-3 glow-box-strong">
              <h4 className="text-[10px] font-black text-[#52525b] uppercase tracking-wider mb-2">Subscription Plan</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#52525b]">Plan:</span>
                  <span className="text-[#111115] font-bold">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525b]">Duration:</span>
                  <span className="text-[#111115] font-bold">{plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525b]">Booking Discount:</span>
                  <span className="text-primary font-bold">{plan.discount_percentage}% off</span>
                </div>
                <div className="flex justify-between border-t border-[#e4e4e7] pt-2 font-black text-base">
                  <span className="text-[#111115]">Amount:</span>
                  <span className="text-primary text-lg">₹{plan.price}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button variant="gradient" onClick={handleActivatePlan} disabled={isActivating} className="w-full text-black font-black uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-1.5">
                {isActivating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ACTIVATE PLAN'} <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button type="button" onClick={() => customerExists ? setStep('phone') : setStep('details')} variant="ghost" className="w-full border border-[#e4e4e7] text-[#52525b] hover:text-[#3f3f46] font-bold uppercase text-[11px] h-11 rounded-xl">
                ← BACK
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
