'use client'

import { useState, useEffect } from 'react'
import {
  Pencil,
  Trash2,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export interface HappyHourRule {
  id: string
  name: string
  discount: number
  devices: string
  schedule: string
  time_range: string 
  status: 'LIVE' | 'PAUSED' | 'SCHEDULED'
}

interface TableProps {
  data: HappyHourRule[]
  onEdit: (rule: HappyHourRule) => void
  onDelete: (id: string) => void
}

const ITEMS_PER_PAGE = 5

export function HappyHourTable({ data = [], onEdit, onDelete }: TableProps) {
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'text-primary border-primary/20 bg-primary/10'
      case 'PAUSED':
        return 'text-gray-400 border-gray-600/50 bg-gray-800/50'
      case 'SCHEDULED':
        return 'text-primary-hover border-primary-hover/20 bg-primary-hover/10'
      default:
        return 'text-gray-400 border-gray-600 bg-gray-800'
    }
  }

  return (
    <div className="bg-[var(--surface)] border border-[#e4e4e7] rounded-xl overflow-hidden flex flex-col">
      {/* RESPONSIVE SCROLLABLE TABLE */}
      <div className="overflow-x-auto min-h-75">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#f4f4f5] text-[#52525b] text-[10px] uppercase font-bold tracking-wider border-b border-[#e4e4e7]">
            <tr>
              <th className="px-6 py-4">Rule Name</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Devices</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-[#e4e4e7] transition-colors group">
                  {/* RULE NAME */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[#111115] font-medium">
                      <div className={`h-1.5 w-1.5 rounded-full ${row.status === 'LIVE' ? 'bg-primary' : 'bg-gray-500'}`}></div>
                      {row.name}
                    </div>
                  </td>

                  {/* DISCOUNT */}
                  <td className="px-6 py-4 text-primary font-bold">
                    {row.discount}% OFF
                  </td>

                  {/* DEVICES */}
                  <td className="px-6 py-4 text-[#52525b]">
                    {row.devices.includes('PS') ? (
                      <div className="flex gap-1 items-center">
                        <span className="bg-[#e4e4e7] text-xs px-2 py-1 rounded-full text-[#111115]">PS</span>
                        <span className="bg-[#e4e4e7] text-xs px-2 py-1 rounded-full text-[#111115]">PC</span>
                        <span className="bg-[#e4e4e7] text-xs px-2 py-1 rounded-full text-[#111115]">XR</span>
                        <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full border border-primary/30">+12</span>
                      </div>
                    ) : (
                      row.devices
                    )}
                  </td>

                  {/* SCHEDULE & TIME RANGE */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[#111115] font-medium text-sm">{row.schedule}</span>
                      {/* Displays the time range immediately below the schedule days */}
                      <span className="text-[#52525b] text-xs mt-0.5">{row.time_range}</span>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 border rounded-md text-[10px] font-bold tracking-widest uppercase ${getStatusStyle(row.status)}`}>
                      {row.status}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-[#52525b]">
                      {row.status === 'PAUSED' && (
                        <button className="hover:text-[#111115] transition-colors" title="Resume">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => onEdit(row)} className="hover:text-[#111115] transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(row.id)} className="hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#52525b]">
                  No active rules found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="p-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52525b]">
        <span>
          Showing <strong className="text-[#111115]">{data.length === 0 ? 0 : startIndex + 1}</strong>{' '}
          to <strong className="text-[#111115]">{Math.min(endIndex, data.length)}</strong> of{' '}
          <strong className="text-[#111115]">{data.length}</strong> rules
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e4e4e7] hover:text-[#111115]"
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
                    : 'text-[#52525b] hover:bg-[#e4e4e7] hover:text-[#111115]'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || data.length === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e4e4e7] hover:text-[#111115]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}