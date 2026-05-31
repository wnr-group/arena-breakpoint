// // 'use client'

// // import React, { useState } from 'react'
// // import { CheckCircle2 } from 'lucide-react'

// // const subscriptionPlans = [
// //   {
// //     id: 'weekend',
// //     category: 'ENTRY LEVEL',
// //     title: 'Weekend Pass',
// //     price: '199',
// //     duration: '/ 7 Days',
// //     features: ['10% off all bookings', 'Standard Support', 'Cafe Lounge Access'],
// //     isPopular: false,
// //     buttonText: 'Select Plan',
// //   },
// //   {
// //     id: 'monthly',
// //     badge: '★ POPULAR',
// //     category: 'CORE GAMER',
// //     title: 'Monthly Pro',
// //     price: '599',
// //     duration: '/ 30 Days',
// //     features: [
// //       '20% off all bookings',
// //       'Priority Rig Reservation',
// //       '10% Food & Beverage Discount',
// //       'Free Tournament Entry (1/mo)',
// //     ],
// //     isPopular: true,
// //     buttonText: 'Select Plan',
// //   },
// //   {
// //     id: 'annual',
// //     badge: 'BEST VALUE',
// //     category: 'ELITE STATUS',
// //     title: 'Annual VIP',
// //     price: '4,999',
// //     duration: '/ 365 Days',
// //     features: [
// //       '₹150 off per booking',
// //       'VIP Elite Lounge Access',
// //       'Private Gaming Pods Access',
// //       'Birthday Special Gift Bag',
// //     ],
// //     isPopular: false,
// //     buttonText: 'Select Plan',
// //   },
// // ]

// // const SubscriptionPricingCard: React.FC = () => {
// //   const [activeCard, setActiveCard] = useState<string>('monthly')

// //   return (
// //     <section
// //       className="bg-transparent overflow-hidden relative py-5 md:py-2"
// //       style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
// //     >
// //       {/* Background Glow */}
// //       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

// //       <div className="max-w-300 mx-auto relative z-10 w-full ">
// //         {/* Scrollable Flex Container */}
// //         <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-8 px-4 md:px-8 hide-scrollbar items-stretch justify-start lg:justify-center">
// //           {subscriptionPlans.map(plan => {
// //             const isActive = activeCard === plan.id

// //             return (
// //               <div
// //                 key={plan.id}
// //                 onClick={() => setActiveCard(plan.id)}
// //                 className={`relative flex flex-col flex-none w-[80vw] max-w-75 h-auto snap-center rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-500 ease-out border  ${
// //                   isActive
// //                     ? 'border-yellow-500/60 bg-[#131313] shadow-[0_0_40px_rgba(234,179,8,0.1)] scale-100 z-10 opacity-100'
// //                     : 'border-neutral-800 bg-[#131313] hover:bg-[#111111] hover:border-neutral-700 lg:scale-95 opacity-80 hover:opacity-100 z-0'
// //                 }`}
// //               >
// //                 {/* Floating Top Badge */}
// //                 {plan.badge && (
// //                   <div
// //                     className={`absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider transition-colors ${
// //                       isActive
// //                         ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
// //                         : 'bg-[#1a1a1a] text-yellow-500 border border-yellow-500/30'
// //                     }`}
// //                   >
// //                     {plan.badge}
// //                   </div>
// //                 )}

// //                 {/* Header Area */}
// //                 <div className="mb-6 mt-2 text-left border-b border-neutral-800/50 pb-6">
// //                   <span className="text-neutral-400 text-xs font-semibold tracking-wider uppercase block mb-1">
// //                     {plan.category}
// //                   </span>
// //                   <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{plan.title}</h3>
// //                   <div className="flex items-baseline">
// //                     <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
// //                       ₹{plan.price}
// //                     </span>
// //                     <span className="text-neutral-400 ml-2 text-xs md:text-sm font-medium">
// //                       {plan.duration}
// //                     </span>
// //                   </div>
// //                 </div>

// //                 {/* Features List */}
// //                 <ul className="grow space-y-3.5 mb-8">
// //                   {plan.features.map((feature, idx) => (
// //                     <li
// //                       key={idx}
// //                       className={`flex items-start text-sm font-medium transition-colors ${
// //                         isActive ? 'text-neutral-200' : 'text-neutral-400'
// //                       }`}
// //                     >
// //                       <CheckCircle2
// //                         className={`w-4 h-4 mr-3 shrink-0 mt-0.5 transition-colors ${
// //                           isActive ? 'text-yellow-500' : 'text-neutral-600'
// //                         }`}
// //                       />
// //                       <span className="leading-tight">{feature}</span>
// //                     </li>
// //                   ))}
// //                 </ul>

// //                 {/* Call to Action Button */}
// //                 <button
// //                   className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-300 mt-auto ${
// //                     isActive
// //                       ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-md'
// //                       : 'bg-transparent border border-neutral-700 text-neutral-300 hover:border-yellow-500 hover:text-yellow-500'
// //                   }`}
// //                 >
// //                   {plan.buttonText}
// //                 </button>
// //               </div>
// //             )
// //           })}
// //         </div>
// //       </div>

// //       {/* Hide Scrollbar CSS */}
// //       <style
// //         dangerouslySetInnerHTML={{
// //           __html: `
// //         .hide-scrollbar::-webkit-scrollbar {
// //           display: none;
// //         }
// //         .hide-scrollbar {
// //           -ms-overflow-style: none;
// //           scrollbar-width: none;
// //         }
// //       `,
// //         }}
// //       />
// //     </section>
// //   )
// // }

// // export default SubscriptionPricingCard

// 'use client'

// import React, { useState } from 'react'
// import { CheckCircle2 } from 'lucide-react'
// import { useRouter } from 'next/navigation' // Imported router for navigation

// const subscriptionPlans = [
//   {
//     id: 'weekend',
//     category: 'ENTRY LEVEL',
//     title: 'Weekend Pass',
//     price: '199',
//     duration: '/ 7 Days',
//     features: ['10% off all bookings', 'Standard Support', 'Cafe Lounge Access'],
//     isPopular: false,
//     buttonText: 'Select Plan',
//   },
//   {
//     id: 'monthly',
//     badge: '★ POPULAR',
//     category: 'CORE GAMER',
//     title: 'Monthly Pro',
//     price: '599',
//     duration: '/ 30 Days',
//     features: [
//       '20% off all bookings',
//       'Priority Rig Reservation',
//       '10% Food & Beverage Discount',
//       'Free Tournament Entry (1/mo)',
//     ],
//     isPopular: true,
//     buttonText: 'Select Plan',
//   },
//   {
//     id: 'annual',
//     badge: 'BEST VALUE',
//     category: 'ELITE STATUS',
//     title: 'Annual VIP',
//     price: '4,999',
//     duration: '/ 365 Days',
//     features: [
//       '₹150 off per booking',
//       'VIP Elite Lounge Access',
//       'Private Gaming Pods Access',
//       'Birthday Special Gift Bag',
//     ],
//     isPopular: false,
//     buttonText: 'Select Plan',
//   },
// ]

// const SubscriptionPricingCard: React.FC = () => {
//   const [activeCard, setActiveCard] = useState<string>('monthly')
//   const router = useRouter() // Initialize the router

//   return (
//     <section
//       className="bg-transparent overflow-hidden relative py-5 md:py-2"
//       style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
//     >
//       {/* Background Glow */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

//       <div className="max-w-300 mx-auto relative z-10 w-full ">
//         {/* Scrollable Flex Container */}
//         <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-8 px-4 md:px-8 hide-scrollbar items-stretch justify-start lg:justify-center">
//           {subscriptionPlans.map(plan => {
//             const isActive = activeCard === plan.id

//             return (
//               <div
//                 key={plan.id}
//                 onClick={() => setActiveCard(plan.id)}
//                 className={`relative flex flex-col flex-none w-[80vw] max-w-75 h-auto snap-center rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-500 ease-out border  ${
//                   isActive
//                     ? 'border-yellow-500/60 bg-[#131313] shadow-[0_0_40px_rgba(234,179,8,0.1)] scale-100 z-10 opacity-100'
//                     : 'border-neutral-800 bg-[#131313] hover:bg-[#111111] hover:border-neutral-700 lg:scale-95 opacity-80 hover:opacity-100 z-0'
//                 }`}
//               >
//                 {/* Floating Top Badge */}
//                 {plan.badge && (
//                   <div
//                     className={`absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider transition-colors ${
//                       isActive
//                         ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
//                         : 'bg-[#1a1a1a] text-yellow-500 border border-yellow-500/30'
//                     }`}
//                   >
//                     {plan.badge}
//                   </div>
//                 )}

//                 {/* Header Area */}
//                 <div className="mb-6 mt-2 text-left border-b border-neutral-800/50 pb-6">
//                   <span className="text-neutral-400 text-xs font-semibold tracking-wider uppercase block mb-1">
//                     {plan.category}
//                   </span>
//                   <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{plan.title}</h3>
//                   <div className="flex items-baseline">
//                     <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
//                       ₹{plan.price}
//                     </span>
//                     <span className="text-neutral-400 ml-2 text-xs md:text-sm font-medium">
//                       {plan.duration}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Features List */}
//                 <ul className="grow space-y-3.5 mb-8">
//                   {plan.features.map((feature, idx) => (
//                     <li
//                       key={idx}
//                       className={`flex items-start text-sm font-medium transition-colors ${
//                         isActive ? 'text-neutral-200' : 'text-neutral-400'
//                       }`}
//                     >
//                       <CheckCircle2
//                         className={`w-4 h-4 mr-3 shrink-0 mt-0.5 transition-colors ${
//                           isActive ? 'text-yellow-500' : 'text-neutral-600'
//                         }`}
//                       />
//                       <span className="leading-tight">{feature}</span>
//                     </li>
//                   ))}
//                 </ul>

//                 {/* Call to Action Button */}
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation() // Prevent triggering the card's onClick
//                     // Optional: You can pass the plan ID in the URL like `/plan-detail?id=${plan.id}` if needed later
//                     router.push('/customer/subscription/${plan.id}')
//                   }}
//                   className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-300 mt-auto ${
//                     isActive
//                       ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-md'
//                       : 'bg-transparent border border-neutral-700 text-neutral-300 hover:border-yellow-500 hover:text-yellow-500'
//                   }`}
//                 >
//                   {plan.buttonText}
//                 </button>
//               </div>
//             )
//           })}
//         </div>
//       </div>

//       {/* Hide Scrollbar CSS */}
//       <style
//         dangerouslySetInnerHTML={{
//           __html: `
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
//       `,
//         }}
//       />
//     </section>
//   )
// }

// export default SubscriptionPricingCard

'use client'

import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const subscriptionPlans = [
  {
    id: 'weekend',
    category: 'ENTRY LEVEL',
    title: 'Weekend Pass',
    price: '199',
    duration: '/ 7 Days',
    features: ['10% off all bookings', 'Standard Support', 'Cafe Lounge Access'],
    isPopular: false,
    buttonText: 'Select Plan',
  },
  {
    id: 'monthly',
    badge: '★ POPULAR',
    category: 'CORE GAMER',
    title: 'Monthly Pro',
    price: '599',
    duration: '/ 30 Days',
    features: [
      '20% off all bookings',
      'Priority Rig Reservation',
      '10% Food & Beverage Discount',
      'Free Tournament Entry (1/mo)',
    ],
    isPopular: true,
    buttonText: 'Select Plan',
  },
  {
    id: 'annual',
    badge: 'BEST VALUE',
    category: 'ELITE STATUS',
    title: 'Annual VIP',
    price: '4,999',
    duration: '/ 365 Days',
    features: [
      '₹150 off per booking',
      'VIP Elite Lounge Access',
      'Private Gaming Pods Access',
      'Birthday Special Gift Bag',
    ],
    isPopular: false,
    buttonText: 'Select Plan',
  },
]

const SubscriptionPricingCard: React.FC = () => {
  const [activeCard, setActiveCard] = useState<string>('monthly')
  const router = useRouter()

  return (
    <section
      className="bg-transparent overflow-hidden relative py-5 md:py-2"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-300 mx-auto relative z-10 w-full ">
        {/* Scrollable Flex Container */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-8 px-4 md:px-8 hide-scrollbar items-stretch justify-start lg:justify-center">
          {subscriptionPlans.map(plan => {
            const isActive = activeCard === plan.id

            return (
              <div
                key={plan.id}
                onClick={() => setActiveCard(plan.id)}
                className={`relative flex flex-col flex-none w-[80vw] max-w-75 h-auto snap-center rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-500 ease-out border  ${
                  isActive
                    ? 'border-yellow-500/60 bg-[#131313] shadow-[0_0_40px_rgba(234,179,8,0.1)] scale-100 z-10 opacity-100'
                    : 'border-neutral-800 bg-[#131313] hover:bg-[#111111] hover:border-neutral-700 lg:scale-95 opacity-80 hover:opacity-100 z-0'
                }`}
              >
                {/* Floating Top Badge */}
                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                        : 'bg-[#1a1a1a] text-yellow-500 border border-yellow-500/30'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Header Area */}
                <div className="mb-6 mt-2 text-left border-b border-neutral-800/50 pb-6">
                  <span className="text-neutral-400 text-xs font-semibold tracking-wider uppercase block mb-1">
                    {plan.category}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{plan.title}</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                      ₹{plan.price}
                    </span>
                    <span className="text-neutral-400 ml-2 text-xs md:text-sm font-medium">
                      {plan.duration}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="grow space-y-3.5 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start text-sm font-medium transition-colors ${
                        isActive ? 'text-neutral-200' : 'text-neutral-400'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mr-3 shrink-0 mt-0.5 transition-colors ${
                          isActive ? 'text-yellow-500' : 'text-neutral-600'
                        }`}
                      />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Call to Action Button */}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    // Fixed string interpolation with backticks (`) and added /customer
                    router.push(`/customer/subscription/${plan.id}`)
                  }}
                  className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-300 mt-auto ${
                    isActive
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-md'
                      : 'bg-transparent border border-neutral-700 text-neutral-300 hover:border-yellow-500 hover:text-yellow-500'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </section>
  )
}

export default SubscriptionPricingCard
