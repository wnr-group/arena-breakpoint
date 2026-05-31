'use client'

import { useState, useEffect, useTransition } from 'react'
import { PlusCircle, Loader2 } from 'lucide-react'
import { AddSubscriptionModal } from '@/components/admin/subscription/AddSubscriptionModal'
import { EditSubscriptionModal } from '@/components/admin/subscription/EditSubscriptionModal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { SubscriptionTable } from '@/components/admin/subscription/SubscriptionTable'

// Import AlertDialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Import your server actions
import {
  getSubscriptionPlans,
  deleteSubscriptionPlan,
} from '@/app/(admin)/admin/subscription/actions'

export default function SubscriptionPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any | null>(null)

  // State for dynamic data and delete confirmation
  const [plans, setPlans] = useState<any[]>([])
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Function to fetch data from Supabase
  const loadPlans = async () => {
    setIsLoading(true)
    try {
      const {data} = await getSubscriptionPlans()
      setPlans(data)
    } catch (error: any) {
      toast.error('Failed to load plans', { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on initial component mount
  useEffect(() => {
    loadPlans()
  }, [])

  // Function to trigger a re-fetch after adding or editing
  const handleRefresh = async () => {
    await loadPlans()
  }

  // Opens the Alert Dialog
  const handleDeleteClick = (id: string) => {
    setPlanToDelete(id)
  }

  // Executes the actual database deletion
  const confirmDelete = () => {
    if (!planToDelete) return

    startTransition(async () => {
      const result = await deleteSubscriptionPlan(planToDelete)

      if (result.success) {
        toast.success('Plan Deleted Successfully')
        await loadPlans()
        setPlanToDelete(null) // Close the modal
      } else {
        toast.error('Deletion Failed', { description: result.error })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 bg-[#0a0a0a] min-h-screen text-white animate-in fade-in duration-700">
      {/* HEADER PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="space-y-1 animate-in slide-in-from-left-4 duration-500">
          <h1 className="text-2xl font-bold tracking-tight text-white">Subscription Management</h1>
          <p className="text-[#a1a1aa] text-sm">
            Configure and monitor Subscription plans for gaming and refreshments.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#FFC107] hover:bg-[#ffcd38] text-black font-semibold rounded-md px-6 transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(255,193,7,0.15)]"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Subscription
        </Button>
      </div>

      {/* MAIN TABLE AREA */}
      <div className="mt-2 animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#121212] border border-[#27272a] rounded-xl text-[#a1a1aa] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#FFC107]" />
            <p className="text-sm font-medium">Loading subscription data...</p>
          </div>
        ) : (
          <SubscriptionTable
            data={plans}
            onEdit={plan => setEditingPlan(plan)}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* ADD / EDIT MODALS */}
      <AddSubscriptionModal open={isAddOpen} setOpen={setIsAddOpen} onFormSuccess={handleRefresh} />

      {editingPlan && (
        <EditSubscriptionModal
          plan={editingPlan}
          open={!!editingPlan}
          setOpen={val => !val && setEditingPlan(null)}
          onFormSuccess={handleRefresh}
        />
      )}

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={!!planToDelete} onOpenChange={open => !open && setPlanToDelete(null)}>
        <AlertDialogContent className="bg-[#121212] border border-[#27272a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Remove Subscription Plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#a1a1aa] text-sm">
              Are you sure you want to delete this subscription plan? This drops the plan completely
              from your database configuration mapping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isPending}
              className="bg-[#27272a] text-white border-zinc-700 hover:bg-zinc-800"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault() // Prevents dialog from closing before DB action finishes
                confirmDelete()
              }}
              disabled={isPending}
              className="bg-[#FFC107] text-black hover:bg-[#FFC107]/90 font-semibold flex items-center justify-center"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isPending ? 'Deleting...' : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
