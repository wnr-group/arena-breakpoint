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
        return 'text-orange-400 border-orange-400/20 bg-orange-400/10'
      case 'PAUSED':
        return 'text-gray-400 border-gray-600/50 bg-gray-800/50'
      case 'SCHEDULED':
        return 'text-[#FFC107] border-[#FFC107]/20 bg-[#FFC107]/10'
      default:
        return 'text-gray-400 border-gray-600 bg-gray-800'
    }
  }

  return (
    <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden flex flex-col">
      {/* RESPONSIVE SCROLLABLE TABLE */}
      <div className="overflow-x-auto min-h-75">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#0a0a0a] text-[#a1a1aa] text-[10px] uppercase font-bold tracking-wider border-b border-[#27272a]">
            <tr>
              <th className="px-6 py-4">Rule Name</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Devices</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-[#1a1a1a]/50 transition-colors group">
                  {/* RULE NAME */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <div className={`h-1.5 w-1.5 rounded-full ${row.status === 'LIVE' ? 'bg-orange-400' : 'bg-gray-500'}`}></div>
                      {row.name}
                    </div>
                  </td>

                  {/* DISCOUNT */}
                  <td className="px-6 py-4 text-[#FFC107] font-bold">
                    {row.discount}% OFF
                  </td>

                  {/* DEVICES */}
                  <td className="px-6 py-4 text-[#a1a1aa]">
                    {row.devices.includes('PS') ? (
                      <div className="flex gap-1 items-center">
                        <span className="bg-[#27272a] text-xs px-2 py-1 rounded-full text-white">PS</span>
                        <span className="bg-[#27272a] text-xs px-2 py-1 rounded-full text-white">PC</span>
                        <span className="bg-[#27272a] text-xs px-2 py-1 rounded-full text-white">XR</span>
                        <span className="bg-[#FFC107]/20 text-[#FFC107] text-xs px-2 py-1 rounded-full border border-[#FFC107]/30">+12</span>
                      </div>
                    ) : (
                      row.devices
                    )}
                  </td>

                  {/* SCHEDULE & TIME RANGE */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-sm">{row.schedule}</span>
                      {/* Displays the time range immediately below the schedule days */}
                      <span className="text-[#a1a1aa] text-xs mt-0.5">{row.time_range}</span>
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
                    <div className="flex items-center justify-end gap-3 text-[#a1a1aa]">
                      {row.status === 'PAUSED' && (
                        <button className="hover:text-white transition-colors" title="Resume">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => onEdit(row)} className="hover:text-white transition-colors">
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
                <td colSpan={6} className="px-6 py-12 text-center text-[#a1a1aa]">
                  No active rules found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="p-4 border-t border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a1a1aa]">
        <span>
          Showing <strong className="text-white">{data.length === 0 ? 0 : startIndex + 1}</strong>{' '}
          to <strong className="text-white">{Math.min(endIndex, data.length)}</strong> of{' '}
          <strong className="text-white">{data.length}</strong> rules
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-[#a1a1aa]">
                ..
              </span>
            ) : (
              <button
                key={`page-${page}`}
                onClick={() => setCurrentPage(page as number)}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors font-medium ${
                  currentPage === page
                    ? 'bg-[#27272a] text-white'
                    : 'text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || data.length === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}