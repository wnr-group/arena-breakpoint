'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const router = useRouter()

  return (
    <nav className="flex items-center text-[15px] font-medium space-x-2.5 mb-8">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={item.label}>
            {isLast ? (
              // Active Page (Yellow)
              <span className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                {item.label}
              </span>
            ) : (
              // Inactive Links (Slate-blueish gray matching your screenshot)
              <span
                className="text-[#52525b] hover:text-[#111115] cursor-pointer transition-colors duration-200"
                onClick={() => item.href && router.push(item.href)}
              >
                {item.label}
              </span>
            )}

            {/* Separator */}
            {!isLast && <ChevronRight className="w-4 h-4 text-[#a1a1aa]" />}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
