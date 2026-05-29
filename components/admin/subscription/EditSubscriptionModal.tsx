'use client'

import { useState, useEffect, useTransition } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { IndianRupee, Clock, Percent, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateSubscriptionPlan } from '@/app/(admin)/admin/subscription/actions'
import { toast } from 'sonner'

interface EditModalProps {
  plan: any // The selected row data from the table
  onFormSuccess?: () => Promise<void> | void
  open: boolean
  setOpen: (open: boolean) => void
}

export function EditSubscriptionModal({ plan, onFormSuccess, open, setOpen }: EditModalProps) {
  const [isActive, setIsActive] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (plan) {
      setIsActive(plan.is_active)
    }
  }, [plan])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const targetForm = e.currentTarget

    startTransition(async () => {
      const submissionFormData = new FormData(targetForm)
      const result = await updateSubscriptionPlan(submissionFormData)

      if (result.success) {
        setOpen(false)
        toast.success('Plan Updated', {
          description: 'Subscription plan modified successfully.',
          icon: <CheckCircle2 className="h-5 w-5 text-[#FFC107]" />,
        })
        if (onFormSuccess) {
          await onFormSuccess()
        }
      } else {
        toast.error('Update Failed', {
          description: result.error,
          icon: <AlertCircle className="h-5 w-5 text-[#f43f5e]" />,
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#121212] border-[#27272a] text-white max-w-2xl p-0 shadow-2xl sm:rounded-xl flex flex-col max-h-[95dvh] sm:max-h-[90dvh]">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex justify-between items-start shrink-0">
          <div className="pr-6">
            <DialogTitle className="text-xl font-bold text-[#FFC107]">
              Edit Subscription Plan
            </DialogTitle>
            <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1">
              Modify pricing, duration, and details
            </p>
          </div>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Hidden fields for backend updates and boolean state */}
          <input type="hidden" name="id" value={plan?.id} />
          <input type="hidden" name="is_active" value={isActive.toString()} />

          {/* Form Body */}
          <div className="p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
              {/* Plan Name - Full Width */}
              <div className="space-y-2 md:col-span-12">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  maxLength={50}
                  defaultValue={plan?.name}
                  className="w-full h-11 rounded-lg border border-[#27272a] bg-[#0a0a0a] px-3 text-sm text-[#FFC107] font-bold focus:ring-1 focus:ring-[#FFC107] outline-none"
                  required
                />
              </div>

              {/* Price - 1/3 Width */}
              <div className="space-y-2 md:col-span-4">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    defaultValue={plan?.price}
                    className="w-full h-11 rounded-lg border border-[#27272a] bg-[#0a0a0a] pl-10 pr-3 text-sm text-white focus:ring-1 focus:ring-[#FFC107] outline-none"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#a1a1aa]">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Duration (Months) - 1/3 Width */}
              <div className="space-y-2 md:col-span-4">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                  Duration (Months) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="duration_months"
                    min="1"
                    defaultValue={plan?.duration_months}
                    className="w-full h-11 rounded-lg border border-[#27272a] bg-[#0a0a0a] pl-10 pr-3 text-sm text-white focus:ring-1 focus:ring-[#FFC107] outline-none"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#a1a1aa]">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Discount Percentage - 1/3 Width */}
              <div className="space-y-2 md:col-span-4">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                  Discount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discount_percentage"
                    min="0"
                    max="100"
                    defaultValue={plan?.discount_percentage}
                    className="w-full h-11 rounded-lg border border-[#27272a] bg-[#0a0a0a] pl-10 pr-3 text-sm text-white focus:ring-1 focus:ring-[#FFC107] outline-none"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#a1a1aa]">
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Description - Full Width */}
              <div className="space-y-2 md:col-span-12">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={plan?.description}
                  className="w-full h-24 rounded-lg border border-[#27272a] bg-[#0a0a0a] p-3 text-sm text-white focus:ring-1 focus:ring-[#FFC107] outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-[#27272a] bg-[#121212] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 rounded-b-xl">
            <div
              className="flex items-center gap-3 cursor-pointer w-full sm:w-auto"
              onClick={() => setIsActive(!isActive)}
            >
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out shrink-0 ${isActive ? 'bg-[#FFC107]' : 'bg-zinc-700'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </div>
              <span className="text-sm font-medium text-white">Plan is Active</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg border border-[#27272a] text-white text-sm font-semibold hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 sm:flex-none flex justify-center items-center px-4 sm:px-6 py-2.5 rounded-lg bg-[#FFC107] text-black text-sm font-bold hover:bg-[#ffcd38] transition-colors shadow-lg shadow-[#FFC107]/10 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
