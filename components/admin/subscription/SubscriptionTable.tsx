'use client'

import { useState, useEffect } from 'react'
import {
  Filter,
  Download,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Clock,
} from 'lucide-react'

interface SubscriptionTableProps {
  data: any[]
  onEdit: (plan: any) => void
  onDelete: (id: string) => void
}

const ITEMS_PER_PAGE = 5

export function SubscriptionTable({ data = [], onEdit, onDelete }: SubscriptionTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [data.length])

  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = data.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="bg-[var(--surface)] border border-[#e4e4e7] rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#e4e4e7]">
        <h2 className="text-lg font-bold text-[#111115]">Subscription Plans</h2>
        <div className="flex gap-2">
          <button className="p-2 bg-[var(--surface-hover)] border border-[#e4e4e7] rounded-md text-[#52525b] hover:text-[#111115] transition-colors">
            <Filter className="h-4 w-4" />
          </button>
          <button className="p-2 bg-[var(--surface-hover)] border border-[#e4e4e7] rounded-md text-[#52525b] hover:text-[#111115] transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-75">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--background)] text-[#52525b] text-[10px] uppercase font-bold tracking-wider border-b border-[#e4e4e7]">
            <tr>
              <th className="px-6 py-4">Plan Name</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {paginatedData.length > 0 ? (
              paginatedData.map(row => (
                <tr key={row.id} className="hover:bg-[var(--surface-hover)]/50 transition-colors">
                  {/* NAME & DESC */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-primary text-sm tracking-wide">{row.name}</div>
                    <div className="text-xs text-[#52525b] mt-0.5 truncate max-w-50">
                      {row.description || 'No description'}
                    </div>
                  </td>

                  {/* DURATION (Fixed to use duration_months) */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[#111115] font-medium">
                      <Clock className="h-3.5 w-3.5 text-[#52525b]" />
                      {row.duration_months} {row.duration_months === 1 ? 'Month' : 'Months'}
                    </div>
                  </td>

                  {/* PRICE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center text-[#111115] font-bold">
                      <IndianRupee className="h-3.5 w-3.5 text-[#52525b] mr-0.5" />
                      {Number(row.price).toFixed(2)}
                    </div>
                  </td>

                  {/* DISCOUNT */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-md">
                      {row.discount_percentage}% OFF
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    {row.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-green-400 border border-green-400/20 rounded-full bg-green-400/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-muted-content border border-[#e4e4e7] rounded-full bg-[#e4e4e7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> Inactive
                      </span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => onEdit(row)}
                        className="text-[#52525b] hover:text-primary transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(row.id)}
                        className="text-[#52525b] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#52525b]">
                  No subscription plans found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52525b]">
        <span>
          Showing <strong className="text-[#111115]">{data.length === 0 ? 0 : startIndex + 1}</strong>{' '}
          to <strong className="text-[#111115]">{Math.min(endIndex, data.length)}</strong> of{' '}
          <strong className="text-[#111115]">{data.length}</strong> plans
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-hover)] hover:text-[#111115]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-[#52525b]">
                ..
              </span>
            ) : (
              <button
                key={`page-${page}`}
                onClick={() => setCurrentPage(page as number)}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors font-medium ${
                  currentPage === page
                    ? 'bg-[#e4e4e7] text-[#111115]'
                    : 'text-[#52525b] hover:bg-[var(--surface-hover)] hover:text-[#111115]'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || data.length === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-hover)] hover:text-[#111115]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
