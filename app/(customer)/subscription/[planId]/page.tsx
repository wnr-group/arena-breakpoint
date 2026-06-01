// 'use client'

// import React, { useState, useEffect } from 'react'
// import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
// import { useParams, useRouter } from 'next/navigation'
// import { Breadcrumb } from '@/components/ui/breadcrumb'
// import { getSubscriptionPlanDetails } from '@/app/(admin)/admin/subscription/actions'

// export default function PlanDetailsPage() {
//   const router = useRouter()
//   const params = useParams()

//   const [otp, setOtp] = useState(['', '', '', '', '', ''])
//   const [plan, setPlan] = useState<any>(null)
//   const [isLoading, setIsLoading] = useState(true)

//   // Fetch the plan data on mount
//   useEffect(() => {
//     const fetchPlan = async () => {
//       try {
//         setIsLoading(true)
//         const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId

//         if (planId) {
//           const response = await getSubscriptionPlanDetails(planId)
//           if (response.success && response.data) {
//             setPlan(response.data)
//           } else {
//             console.error('Failed to load plan:', response.message)
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching plan:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchPlan()
//   }, [params.planId])

//   const handleOtpChange = (index: number, value: string) => {
//     if (value.length > 1) return
//     const newOtp = [...otp]
//     newOtp[index] = value
//     setOtp(newOtp)

//     if (value && index < 5) {
//       const nextInput = document.getElementById(`otp-${index + 1}`)
//       nextInput?.focus()
//     }
//   }

//   // Format the ISO date to a readable format (e.g., "June 30, 2026")
//   const formatDate = (isoString: string) => {
//     if (!isoString) return ''
//     const date = new Date(isoString)
//     return date.toLocaleDateString('en-US', {
//       month: 'long',
//       day: '2-digit',
//       year: 'numeric',
//     })
//   }

//   if (isLoading) {
//     return (
//       <main className="min-h-screen bg-black flex flex-col items-center justify-center text-yellow-500">
//         <Loader2 className="w-12 h-12 animate-spin mb-4" />
//         <p className="text-neutral-400 font-medium">Loading plan details...</p>
//       </main>
//     )
//   }

//   if (!plan) {
//     return (
//       <main className="min-h-screen bg-black flex items-center justify-center text-white">
//         <p>Plan not found.</p>
//       </main>
//     )
//   }

//   // Parse features from description or use fallbacks
//   const features = plan.description
//     ? plan.description.split(',').map((f: string) => f.trim())
//     : ['Standard Arena Access']

//   // Determine Duration text
//   const durationText = plan.duration_months
//     ? `${plan.duration_months} Month${plan.duration_months > 1 ? 's' : ''}`
//     : `${plan.duration_days || 30} Days`

//   return (
//     <main
//       className="min-h-screen bg-black text-white font-sans py-8 md:py-12"
//       style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
//     >
//       <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Breadcrumb */}
//         <Breadcrumb
//           items={[
//             { label: 'Home', href: '/' },
//             { label: 'Subscriptions', href: '/customer/subscription' },
//             { label: plan.name },
//           ]}
//         />

//         {/* Page Title */}
//         <h1 className="text-3xl md:text-[42px] font-extrabold text-white mb-8 tracking-tight">
//           Subscribe to {plan.name}
//         </h1>

//         {/* Main Grid Layout */}
//         <div className="flex flex-col lg:flex-row gap-8 items-start">
//           {/* Left Column (Details & Form) */}
//           <div className="w-full lg:w-2/3 space-y-6">
//             {/* UPDATED: Unified Plan Details Card */}
//             <div className="bg-[#131313] border border-neutral-800 rounded-xl p-6 md:p-8">
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
//                 <div className="flex flex-col">
//                   <span className="text-neutral-400 text-sm font-medium mb-1.5">Duration</span>
//                   <span className="text-white text-xl md:text-[22px] font-bold tracking-tight">
//                     {durationText}
//                   </span>
//                 </div>

//                 <div className="flex flex-col">
//                   <span className="text-neutral-400 text-sm font-medium mb-1.5">Valid Until</span>
//                   <span className="text-white text-xl md:text-[22px] font-bold tracking-tight leading-tight">
//                     {formatDate(plan.validity)}
//                   </span>
//                 </div>

//                 <div className="flex flex-col">
//                   <span className="text-neutral-400 text-sm font-medium mb-1.5">Discount</span>
//                   <span className="text-yellow-500 text-xl md:text-[22px] font-bold tracking-tight">
//                     {plan.discount_percentage}%
//                   </span>
//                 </div>

//                 <div className="flex flex-col">
//                   <span className="text-neutral-400 text-sm font-medium mb-1.5">Price</span>
//                   <span className="text-white text-xl md:text-[22px] font-bold tracking-tight">
//                     ₹{plan.price}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="bg-[#131313] border border-neutral-800 rounded-md p-6 md:p-8">
//                 <h3 className="text-lg font-bold text-white mb-6">Elite Benefits</h3>
//                 <ul className="space-y-4">
//                   {features.map((benefit: string, i: number) => (
//                     <li
//                       key={i}
//                       className="flex items-start text-[14px] md:text-[15px] font-medium text-neutral-300 leading-tight"
//                     >
//                       <CheckCircle2 className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
//                       {benefit}
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               {/* Pro Savings Box */}
//               <div className="bg-[#131313] border border-neutral-800 rounded-md p-6 md:p-8 flex flex-col">
//                 <h3 className="text-lg font-bold text-white mb-6">Pro Savings</h3>

//                 <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-5 flex justify-between items-center mb-6">
//                   <div>
//                     <div className="text-white font-bold text-sm md:text-base">PS5 Pro Booking</div>
//                     <div className="text-neutral-500 text-xs md:text-sm font-medium mt-1">
//                       Standard Session
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-neutral-500 line-through text-xs md:text-sm font-medium mb-0.5">
//                       ₹300
//                     </div>
//                     <div className="text-yellow-500 font-extrabold text-xl md:text-2xl">
//                       ₹{Math.round(300 - 300 * (plan.discount_percentage / 100))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="mt-auto text-center">
//                   <p className="text-neutral-400 text-sm italic font-medium">
//                     "Recover your plan cost in just a few sessions!"
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#131313] border border-neutral-800 rounded-md p-6 md:p-8">
//               <h3 className="text-lg font-bold text-white mb-6">Subscriber Details</h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
//                     Full Name
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="John Doe"
//                     className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-lg px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-sm font-medium"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
//                     Phone Number
//                   </label>
//                   <input
//                     type="tel"
//                     placeholder="+91 9876543210"
//                     className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-lg px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-sm font-medium"
//                   />
//                 </div>
//                 <div className="space-y-2 md:col-span-2">
//                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
//                     Email Address
//                   </label>
//                   <input
//                     type="email"
//                     placeholder="john.doe@email.com"
//                     className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-lg px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-sm font-medium"
//                   />
//                 </div>
//               </div>

//               <div className="border-t border-neutral-800 pt-6">
//                 <h4 className="text-sm font-bold text-white mb-4">Phone Verification</h4>
//                 <div className="space-y-2">
//                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
//                     6-Digit OTP
//                   </label>
//                   <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
//                     <div className="flex gap-2 md:gap-3">
//                       {otp.map((digit, index) => (
//                         <input
//                           key={index}
//                           id={`otp-${index}`}
//                           type="text"
//                           maxLength={1}
//                           value={digit}
//                           onChange={e => handleOtpChange(index, e.target.value)}
//                           className="w-10 h-12 md:w-12 md:h-14 bg-[#1a1a1a] border border-neutral-800 rounded-lg text-center text-lg font-bold text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
//                         />
//                       ))}
//                     </div>
//                     <button className="bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold py-3 px-8 rounded-lg transition-colors text-sm w-full sm:w-auto">
//                       Verify
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Column (Order Summary) */}
//           <div className="w-full lg:w-1/3">
//             <div className="bg-[#131313] border border-neutral-800 rounded-md p-6 md:p-8 sticky top-8">
//               <h3 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-4">
//                 Order Summary
//               </h3>

//               <div className="space-y-4 mb-6">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <div className="text-neutral-300 font-medium text-[15px]">{plan.name}</div>
//                     <div className="text-neutral-500 text-xs mt-1">{durationText} Membership</div>
//                   </div>
//                   <div className="text-white font-medium">₹{plan.price}</div>
//                 </div>

//                 <div className="flex justify-between items-center pt-2">
//                   <div className="text-neutral-400 text-sm">GST (Included)</div>
//                   <div className="text-white text-sm">₹0</div>
//                 </div>
//               </div>

//               <div className="border-t border-neutral-800 pt-5 mb-8">
//                 <div className="flex justify-between items-end">
//                   <div className="text-white font-bold text-lg">Total Amount</div>
//                   <div className="text-yellow-500 font-extrabold text-3xl">₹{plan.price}</div>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <button
//                   onClick={() => router.push(`/customer/subscription/${params.planId}/success`)}
//                   className="w-full bg-[#FFD700] hover:bg-[#F2C900] text-black font-extrabold py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.15)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:scale-[1.02] text-[15px]"
//                 >
//                   Pay & Activate
//                 </button>
//                 <button
//                   onClick={() => router.back()}
//                   className="w-full bg-transparent border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 font-bold py-4 rounded-xl transition-all text-[15px]"
//                 >
//                   Back to Plans
//                 </button>
//               </div>

//               <div className="flex items-center justify-center mt-6 text-neutral-500 space-x-2">
//                 <ShieldCheck className="w-4 h-4" />
//                 <span className="text-xs font-medium">Ensures 256-bit Encrypted Payment</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer Image Banner */}
//         <div className="mt-12 md:mt-16 w-full rounded-3xl overflow-hidden relative border border-neutral-800 bg-black min-h-75 flex items-center p-8 md:p-16">
//           <img
//             src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFIKGeG2W9raLeDyuxdA9-PVKMcg3gGd30OuafHGO6cRvygZE1X1yb2QDWNvJMYIeuonRyPfymKfC69DyUaTfstYmffrR5GZR6zomB8a7o2dZn6pn_k-FJBA7lOD6wHKbh3uBhRSfZngbB2fq5-_XbFctoGCCoZdgmL9iQyXQ6cQEDm-tCNQSdiIlbRL4I6Z7lG8uvNQ4tnR_yDSF4sCCLZxiUR4GK80YjNc1I6hHuLGSx_TKeSVfzi1pZ23Q4htMWY6yGxtUHpQ"
//             alt="Gaming Setup Background"
//             className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
//           />
//           <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-transparent" />

//           <div className="relative z-10 max-w-xl">
//             <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
//               The Arena Awaits Your Command.
//             </h2>
//             <p className="text-neutral-300 text-sm md:text-base font-medium leading-relaxed">
//               Unlock the full potential of your gaming performance with professional-grade gear and
//               priority access.
//             </p>
//           </div>
//         </div>
//       </div>
//     </main>
//   )
// }

'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Breadcrumb } from '@/components/ui/breadcrumb'

// Import BOTH of your server actions
import { getSubscriptionPlanDetails } from '@/app/(admin)/admin/subscription/actions'
import { activateSubscriptionPlan } from './action'

export default function PlanDetailsPage() {
  const router = useRouter()
  const params = useParams()

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

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
        router.push(`/customer/subscription/${params.planId}/success`)
      } else {
        alert(result.message || 'Failed to activate plan')
        setIsActivating(false)
      }
    } catch (error) {
      console.error('Activation error:', error)
      alert('Something went wrong during activation.')
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
    <main
      className="min-h-screen bg-black text-white font-sans py-8 md:py-12"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Subscriptions', href: '/customer/subscription' },
            { label: plan.name },
          ]}
        />

        {/* Page Title */}
        <h1 className="text-3xl md:text-[42px] font-extrabold text-white mb-8 tracking-tight">
          Subscribe to {plan.name}
        </h1>

        {/* Main Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column (Details & Form) */}
          <div className="w-full lg:w-2/3 space-y-6">
            {/* Unified Plan Details Card */}
            <div className="bg-[#131313] border border-neutral-800 rounded-xl p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                <div className="flex flex-col">
                  <span className="text-neutral-400 text-sm font-medium mb-1.5">Duration</span>
                  <span className="text-white text-xl md:text-[22px] font-bold tracking-tight">
                    {durationText}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-neutral-400 text-sm font-medium mb-1.5">Valid Until</span>
                  <span className="text-white text-xl md:text-[22px] font-bold tracking-tight leading-tight">
                    {formatDate(plan.validity)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-neutral-400 text-sm font-medium mb-1.5">Discount</span>
                  <span className="text-yellow-500 text-xl md:text-[22px] font-bold tracking-tight">
                    {plan.discount_percentage}%
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-neutral-400 text-sm font-medium mb-1.5">Price</span>
                  <span className="text-white text-xl md:text-[22px] font-bold tracking-tight">
                    ₹{plan.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Elite Benefits */}
              <div className="bg-[#131313] border border-neutral-800 rounded-md p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-6">Elite Benefits</h3>
                <ul className="space-y-4">
                  {features.map((benefit: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start text-[14px] md:text-[15px] font-medium text-neutral-300 leading-tight"
                    >
                      <CheckCircle2 className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Savings Box */}
              <div className="bg-[#131313] border border-neutral-800 rounded-md p-6 md:p-8 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-6">Pro Savings</h3>

                <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl p-5 flex justify-between items-center mb-6">
                  <div>
                    <div className="text-white font-bold text-sm md:text-base">PS5 Pro Booking</div>
                    <div className="text-neutral-500 text-xs md:text-sm font-medium mt-1">
                      Standard Session
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-neutral-500 line-through text-xs md:text-sm font-medium mb-0.5">
                      ₹300
                    </div>
                    <div className="text-yellow-500 font-extrabold text-xl md:text-2xl">
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
            <div className="bg-[#131313] border border-neutral-800 rounded-md p-6 md:p-8">
              <h3 className="text-lg font-bold text-white mb-6">Subscriber Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-lg px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-lg px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="john.doe@email.com"
                    className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-lg px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {/* OTP Verification Box */}
              <div className="border-t border-neutral-800 pt-6">
                <h4 className="text-sm font-bold text-white mb-4">Phone Verification</h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
                    6-Digit OTP
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex gap-2 md:gap-3">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(index, e.target.value)}
                          className="w-10 h-12 md:w-12 md:h-14 bg-[#1a1a1a] border border-neutral-800 rounded-lg text-center text-lg font-bold text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                        />
                      ))}
                    </div>
                    <button className="bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold py-3 px-8 rounded-lg transition-colors text-sm w-full sm:w-auto">
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Order Summary) */}
          <div className="w-full lg:w-1/3">
            <div className="bg-[#131313] border border-neutral-800 rounded-md p-6 md:p-8 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-4">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-neutral-300 font-medium text-[15px]">{plan.name}</div>
                    <div className="text-neutral-500 text-xs mt-1">{durationText} Membership</div>
                  </div>
                  <div className="text-white font-medium">₹{plan.price}</div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-neutral-400 text-sm">GST (Included)</div>
                  <div className="text-white text-sm">₹0</div>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-5 mb-8">
                <div className="flex justify-between items-end">
                  <div className="text-white font-bold text-lg">Total Amount</div>
                  <div className="text-yellow-500 font-extrabold text-3xl">₹{plan.price}</div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Submit Button Linked to Server Action */}
                <button
                  onClick={handleActivatePlan}
                  disabled={isActivating}
                  className="w-full bg-[#FFD700] hover:bg-[#F2C900] text-black font-extrabold py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.15)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:scale-[1.02] text-[15px] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    'Pay & Activate'
                  )}
                </button>
                <button
                  onClick={() => router.back()}
                  disabled={isActivating}
                  className="w-full bg-transparent border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 font-bold py-4 rounded-xl transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back to Plans
                </button>
              </div>

              <div className="flex items-center justify-center mt-6 text-neutral-500 space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-medium">Ensures 256-bit Encrypted Payment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Image Banner */}
        <div className="mt-12 md:mt-16 w-full rounded-3xl overflow-hidden relative border border-neutral-800 bg-black min-h-[300px] flex items-center p-8 md:p-16">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFIKGeG2W9raLeDyuxdA9-PVKMcg3gGd30OuafHGO6cRvygZE1X1yb2QDWNvJMYIeuonRyPfymKfC69DyUaTfstYmffrR5GZR6zomB8a7o2dZn6pn_k-FJBA7lOD6wHKbh3uBhRSfZngbB2fq5-_XbFctoGCCoZdgmL9iQyXQ6cQEDm-tCNQSdiIlbRL4I6Z7lG8uvNQ4tnR_yDSF4sCCLZxiUR4GK80YjNc1I6hHuLGSx_TKeSVfzi1pZ23Q4htMWY6yGxtUHpQ"
            alt="Gaming Setup Background"
            className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

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
