'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Edit2, Plus, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { getExpenses, addExpense, updateExpense, deleteExpense, type Expense } from '@/app/(admin)/admin/reports/actions'
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
} from "@/components/ui/alert-dialog"

interface ExpensesTabProps {
  dateFrom: string
  dateTo: string
}

export function ExpensesTab({ dateFrom, dateTo }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form states
  const [formDate, setFormDate] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')

  useEffect(() => {
    loadExpenses()
  }, [dateFrom, dateTo])

  const loadExpenses = async () => {
    setLoading(true)
    const result = await getExpenses({ dateFrom, dateTo })
    if (result.success) {
      setExpenses(result.expenses)
    } else {
      toast.error('Failed to load expenses')
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!formDate || !formDescription || !formAmount) {
      toast.error('Please fill all fields')
      return
    }

    const result = await addExpense({
      date: formDate,
      description: formDescription,
      amount: parseFloat(formAmount),
    })

    if (result.success) {
      toast.success('Expense added successfully')
      setFormDate('')
      setFormDescription('')
      setFormAmount('')
      setShowAddForm(false)
      loadExpenses()
    } else {
      toast.error(result.error || 'Failed to add expense')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!formDate || !formDescription || !formAmount) {
      toast.error('Please fill all fields')
      return
    }

    const result = await updateExpense(id, {
      date: formDate,
      description: formDescription,
      amount: parseFloat(formAmount),
    })

    if (result.success) {
      toast.success('Expense updated successfully')
      setEditingId(null)
      loadExpenses()
    } else {
      toast.error(result.error || 'Failed to update expense')
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteExpense(id)
    if (result.success) {
      toast.success('Expense deleted successfully')
      loadExpenses()
    } else {
      toast.error(result.error || 'Failed to delete expense')
    }
  }

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setFormDate(expense.date)
    setFormDescription(expense.description)
    setFormAmount(expense.amount.toString())
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormDate('')
    setFormDescription('')
    setFormAmount('')
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-[var(--surface)] border-[#27272a] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-black uppercase mb-2">Total Expenses</p>
            <p className="text-3xl font-black text-red-400">₹{totalExpenses.toLocaleString('en-IN')}</p>
            <p className="text-xs text-zinc-600 mt-1">{expenses.length} expense(s)</p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-primary text-black font-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </Card>

      {/* Add Form */}
      {showAddForm && (
        <Card className="bg-[var(--surface)] border-primary/40 p-6">
          <h3 className="text-sm font-black uppercase text-white mb-4">Add New Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-zinc-500">Date</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="bg-[var(--background)] border-zinc-800 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-500">Description</Label>
              <Input
                placeholder="e.g., Electricity Bill"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="bg-[var(--background)] border-zinc-800 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-500">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="bg-[var(--background)] border-zinc-800 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-primary text-black">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={() => setShowAddForm(false)} variant="ghost">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Expenses Table */}
      <Card className="bg-[var(--surface)] border-[#27272a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--background)] border-b border-[#27272a]">
              <tr>
                <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase">Date</th>
                <th className="py-4 px-4 text-left text-[10px] text-zinc-500 font-black uppercase">Description</th>
                <th className="py-4 px-4 text-right text-[10px] text-zinc-500 font-black uppercase">Amount</th>
                <th className="py-4 px-4 text-right text-[10px] text-zinc-500 font-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-600">Loading...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-600">No expenses found</td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    {editingId === expense.id ? (
                      <>
                        <td className="py-3 px-4">
                          <Input
                            type="date"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            className="bg-[var(--background)] border-zinc-800 text-white h-8 text-sm"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            className="bg-[var(--background)] border-zinc-800 text-white h-8 text-sm"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={formAmount}
                            onChange={(e) => setFormAmount(e.target.value)}
                            className="bg-[var(--background)] border-zinc-800 text-white h-8 text-sm text-right"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(expense.id)}
                              className="h-7 px-2 bg-primary text-black"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" onClick={cancelEdit} variant="ghost" className="h-7 px-2">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 text-sm text-zinc-300">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-white font-medium">{expense.description}</td>
                        <td className="py-3 px-4 text-sm text-right font-black text-red-400">
                          ₹{Number(expense.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => startEdit(expense)}
                              variant="ghost"
                              className="h-7 w-7 p-0 text-primary hover:text-primary-hover"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[var(--surface)] border border-[#27272a] text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-bold">Delete Expense Record?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-[#a1a1aa] text-sm">
                                    Are you sure you want to delete the expense **"{expense.description}"**? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4">
                                  <AlertDialogCancel className="bg-[#27272a] text-white border-zinc-700 hover:bg-zinc-800 hover:text-white">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(expense.id)}
                                    className="bg-gradient-primary text-[var(--button-text)] font-semibold"
                                  >
                                    Confirm Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
