// interface TableRow {
//   plan: string
//   price: string
//   duration: string
//   savings: string
//   benefits: string
// }

// const tableData: TableRow[] = [
//   {
//     plan: 'Weekend Pass',
//     price: '₹199',
//     duration: '7 Days',
//     savings: 'Up to 10%',
//     benefits: 'Standard Arena Access',
//   },
//   {
//     plan: 'Monthly Pro',
//     price: '₹599',
//     duration: '30 Days',
//     savings: 'Up to 20%',
//     benefits: 'Priority + Cafe Discounts',
//   },
//   {
//     plan: 'Annual VIP',
//     price: '₹4,999',
//     duration: '365 Days',
//     savings: 'Flat ₹150 Off',
//     benefits: 'VIP Lounges + Private Pods',
//   },
// ]

// export const ComparisonTable: React.FC = () => {
//   return (
//     <div className="w-full mt-2 overflow-x-auto">
//       <h2 className="text-3xl font-bold text-center text-white mb-10">Quick Comparison</h2>
//       <div className="min-w-[800px] bg-[#131313] rounded-xl overflow-hidden border border-neutral-800">
//         {/* Table Header */}
//         <div className="grid grid-cols-5 bg-[#1a1a1a] p-4 border-b border-neutral-800">
//           {['Plan', 'Price', 'Duration', 'Savings', 'Benefits'].map((heading, i) => (
//             <div
//               key={i}
//               className="text-neutral-400 font-semibold text-sm uppercase tracking-wider text-left pl-4"
//             >
//               {heading}
//             </div>
//           ))}
//         </div>
//         {/* Table Body */}
//         <div className="divide-y divide-neutral-800">
//           {tableData.map((row, i) => (
//             <div
//               key={i}
//               className="grid grid-cols-5 p-4 items-center hover:bg-[#181818] transition-colors"
//             >
//               <div className="font-bold text-white pl-4">{row.plan}</div>
//               <div className="text-neutral-300 pl-4">{row.price}</div>
//               <div className="text-neutral-300 pl-4">{row.duration}</div>
//               <div className="text-neutral-300 pl-4">{row.savings}</div>
//               <div className="text-neutral-300 pl-4">{row.benefits}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import React from 'react'

export interface TableRow {
  plan: string
  price: string
  duration: string
  savings: string
  benefits: string
}

const tableData: TableRow[] = [
  {
    plan: 'Weekend Pass',
    price: '₹199',
    duration: '7 Days',
    savings: 'Up to 10%',
    benefits: 'Standard Arena Access',
  },
  {
    plan: 'Monthly Pro',
    price: '₹599',
    duration: '30 Days',
    savings: 'Up to 20%',
    benefits: 'Priority + Cafe Discounts',
  },
  {
    plan: 'Annual VIP',
    price: '₹4,999',
    duration: '365 Days',
    savings: 'Flat ₹150 Off',
    benefits: 'VIP Lounges + Private Pods',
  },
]

export const ComparisonTable: React.FC = () => {
  return (
    <div
      className="w-full mt-12 overflow-x-auto px-4 pb-12"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-10 tracking-tight">
        Quick Comparison
      </h2>

      {/* Wrapper to center table on large screens and handle overflow */}
      <div className="max-w-[1000px] mx-auto min-w-[800px] rounded-xl overflow-hidden shadow-2xl">
        {/* Table Header - Matches the warm dark tint from the image */}
        <div className="grid grid-cols-5 bg-[#2B271E] p-5">
          {['Plan', 'Price', 'Duration', 'Savings', 'Benefits'].map((heading, i) => (
            <div key={i} className="text-white font-bold text-[15px] text-left pl-6">
              {heading}
            </div>
          ))}
        </div>

        {/* Table Body - Alternating row colors matching the image exactly */}
        <div className="flex flex-col">
          {tableData.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-5 p-5 items-center transition-colors ${
                i % 2 === 0 ? 'bg-[#191919]' : 'bg-[#222222]'
              }`}
            >
              <div className="font-bold text-white pl-6 text-[14px] md:text-[15px]">{row.plan}</div>
              <div className="text-neutral-300 pl-6 text-[14px] md:text-[15px] font-medium">
                {row.price}
              </div>
              <div className="text-neutral-300 pl-6 text-[14px] md:text-[15px] font-medium">
                {row.duration}
              </div>
              <div className="text-neutral-300 pl-6 text-[14px] md:text-[15px] font-medium">
                {row.savings}
              </div>
              <div className="text-neutral-300 pl-6 text-[14px] md:text-[15px] font-medium">
                {row.benefits}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
