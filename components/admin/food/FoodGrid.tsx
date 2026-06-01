'use client'

import { useTransition } from 'react'
import { MenuItem } from '@/lib/types/food'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2, Loader2, Utensils } from 'lucide-react'
import { updateMenuItem } from '@/app/(admin)/admin/food/actions'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface FoodGridProps {
  devices: MenuItem[]
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  isPending: boolean
  onRefreshData?: () => Promise<void> | void
}

export function FoodGrid({ devices, onEdit, onDelete, isPending, onRefreshData }: FoodGridProps) {
  const [, startToggleTransition] = useTransition()

  const handleToggleStatus = (item: MenuItem) => {
    startToggleTransition(async () => {
      const targetNewStatus = item.status === 'available' ? 'out_of_stock' : 'available'

      const updatePayload = new FormData()
      updatePayload.set('id', item.id)
      updatePayload.set('name', item.name)
      updatePayload.set('category', item.category)
      updatePayload.set('price', String(item.price))
      updatePayload.set('quantity', String(item.quantity))
      updatePayload.set('status', targetNewStatus)
      updatePayload.set('description', item.description || '')
      updatePayload.set('image_url', item.image_url || '')

      const result = await updateMenuItem(updatePayload)
      if (result.success) {
        toast.success(
          `'${item.name}' Marked ${targetNewStatus === 'available' ? 'Available' : 'Out of Stock'}`
        )
        if (onRefreshData) await onRefreshData()
      } else {
        toast.error('Failed to alter availability status state')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {devices.map(item => {
        const totalQty = Number(item.quantity) || 0
        const isCurrentlyAvailable = item.status === 'available'

        return (
          <Card
            key={item.id}
            className="bg-[#121212] border-[#27272a] hover:border-[#FFC107]/50 hover:shadow-[0_0_20px_rgba(255,193,7,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden group relative"
          >
            {/* 1. MEDIA HEADER ASSET FRAME */}
            <div className="h-48 w-full bg-zinc-950 border-b border-[#27272a] flex items-center justify-center overflow-hidden relative">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center text-zinc-800 gap-1.5">
                  <Utensils className="h-6 w-6" />
                  <span className="text-[10px]">No Cover Asset</span>
                </div>
              )}

              {/* Absolute Corner Category Tag */}
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black text-[#FFC107] bg-black/60 border border-[#FFC107]/20 rounded-md backdrop-blur-md uppercase tracking-wider">
                  {item.category}
                </span>
              </div>

              {/* Dynamic Stock Volume Metric Tag */}
              {isCurrentlyAvailable && (
                <div className="absolute top-3 right-3 z-10 animate-in fade-in zoom-in-95 duration-200">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black text-white bg-black/60 border border-green-500/30 rounded-md backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 inline-block animate-pulse" />
                    {totalQty} UNITS
                  </span>
                </div>
              )}
            </div>

            {/* 2. DESCRIPTION TEXT AND OPERATOR CONTROLS CONTAINER */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                {/* 💡 FIXED: Split title and status into a flexible row wrapper without max-width caps or truncation cuts */}
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className="font-black text-base text-white group-hover:text-[#FFC107] transition-colors leading-snug break-words flex-1"
                    title={item.name}
                  >
                    {item.name}
                  </h3>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wide transition-colors mt-0.5 flex-shrink-0 ${
                      isCurrentlyAvailable ? 'text-[#FFC107]' : 'text-zinc-600'
                    }`}
                  >
                    {isCurrentlyAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>

                {/* Pricing + Custom Toggle Switch Row */}
                <div className="flex items-center justify-between">
                  <div className="text-[#FFC107] font-black text-xl">
                    ₹{item.price ? Number(item.price).toLocaleString('en-IN') : '0'}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out outline-none ${
                      isCurrentlyAvailable ? 'bg-[#FFC107]' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                        isCurrentlyAvailable ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-[#a1a1aa]/70 line-clamp-2 h-8 leading-relaxed pt-0.5">
                  {item.description ||
                    'Premium operational kitchen item configuration with zero details logged.'}
                </p>
              </div>
            </div>

            {/* 3. ACCORDION HOVER PANEL */}
            <div className="mt-auto h-0 opacity-0 group-hover:h-14 group-hover:opacity-100 transition-all duration-300 ease-out bg-[#0e0e0e]/60 border-t border-[#27272a]/30 flex items-center justify-end gap-2 px-4 overflow-hidden w-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(item)}
                className="h-8 w-8 text-white bg-[#27272a] hover:bg-[#3f3f46] border border-zinc-700/60 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className="h-8 w-8 text-white bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-colors"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="bg-[#121212] border border-[#27272a] text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">
                      Remove Menu Item Record?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#a1a1aa] text-sm">
                      Are you sure you want to delete **{item.name}**? This drops the asset
                      parameters completely from your database configuration mapping.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="bg-[#27272a] text-white border-zinc-700 hover:bg-zinc-800">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(item.id)}
                      className="bg-[#FFC107] text-black hover:bg-[#FFC107]/90 font-semibold"
                    >
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
