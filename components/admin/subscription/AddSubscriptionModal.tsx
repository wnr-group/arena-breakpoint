'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { IndianRupee, Clock, Percent, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createSubscriptionPlan } from '@/app/(admin)/admin/subscription/actions'
import { toast } from 'sonner'

interface AddModalProps {
  onFormSuccess?: () => Promise<void> | void
  open: boolean
  setOpen: (open: boolean) => void
}

export function AddSubscriptionModal({ onFormSuccess, open, setOpen }: AddModalProps) {
  const [isActive, setIsActive] = useState(true)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const targetForm = e.currentTarget

    startTransition(async () => {
      const submissionFormData = new FormData(targetForm)

      const result = await createSubscriptionPlan(submissionFormData)

      if (result.success) {
        setOpen(false)
        toast.success('Plan Created', {
          description: 'New subscription plan added successfully.',
          icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
        })

        if (onFormSuccess) {
          await onFormSuccess()
        }
      } else {
        toast.error('Creation Failed', {
          description: result.error,
          icon: <AlertCircle className="h-5 w-5 text-[#f43f5e]" />,
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[var(--surface)] border-[#e4e4e7] text-[#111115] max-w-2xl p-0 shadow-2xl sm:rounded-xl flex flex-col max-h-[95dvh] sm:max-h-[90dvh]">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex justify-between items-start shrink-0">
          <div className="pr-6">
            <DialogTitle className="text-xl font-bold text-primary">
              Create Subscription Plan
            </DialogTitle>
            <p className="text-xs sm:text-sm text-[#52525b] mt-1">
              Configure pricing and duration for a new plan
            </p>
          </div>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <input type="hidden" name="is_active" value={isActive.toString()} />

          {/* Form Body */}
          <div className="p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
              <div className="space-y-2 md:col-span-12">
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  maxLength={50}
                  placeholder="e.g. Monthly Elite Pass"
                  className="w-full h-11 rounded-lg border border-[#e4e4e7] bg-[var(--background)] px-3 text-sm text-primary font-bold focus:ring-1 focus:ring-[#FFC107] outline-none"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-4">
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    className="w-full h-11 rounded-lg border border-[#e4e4e7] bg-[var(--background)] pl-10 pr-3 text-sm text-[#111115] focus:ring-1 focus:ring-[#FFC107] outline-none"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#52525b]">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-4">
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">
                  Duration (Months) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="duration_months"
                    min="1"
                    max="60"
                    placeholder="1"
                    className="w-full h-11 rounded-lg border border-[#e4e4e7] bg-[var(--background)] pl-10 pr-3 text-sm text-[#111115] focus:ring-1 focus:ring-[#FFC107] outline-none"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#52525b]">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-4">
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">
                  Discount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discount_percentage"
                    min="0"
                    max="100"
                    defaultValue="20"
                    className="w-full h-11 rounded-lg border border-[#e4e4e7] bg-[var(--background)] pl-10 pr-3 text-sm text-[#111115] focus:ring-1 focus:ring-[#FFC107] outline-none"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#52525b]">
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-12">
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  placeholder="List the perks, features, or restrictions of this plan..."
                  className="w-full h-24 rounded-lg border border-[#e4e4e7] bg-[var(--background)] p-3 text-sm text-[#111115] focus:ring-1 focus:ring-[#FFC107] outline-none resize-none"
                  required
                  minLength={10}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-[#e4e4e7] bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 rounded-b-xl">
            <div
              className="flex items-center gap-3 cursor-pointer w-full sm:w-auto"
              onClick={() => setIsActive(!isActive)}
            >
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out shrink-0 ${isActive ? 'bg-gradient-primary' : 'bg-[#e4e4e7]'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </div>
              <span className="text-sm font-medium text-[#111115]">Plan is Active</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg border border-[#e4e4e7] text-[#111115] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 sm:flex-none flex justify-center items-center px-4 sm:px-6 py-2.5 rounded-lg bg-gradient-primary text-black text-sm font-bold hover:bg-gradient-primary-hover transition-colors shadow-lg shadow-primary/10 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Plan'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
