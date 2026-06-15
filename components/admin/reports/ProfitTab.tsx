'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Receipt, Percent } from 'lucide-react'
import { getProfitAndLoss } from '@/app/(admin)/admin/reports/actions'
import { toast } from 'sonner'

interface ProfitTabProps {
  dateFrom: string
  dateTo: string
}

export function ProfitTab({ dateFrom, dateTo }: ProfitTabProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [dateFrom, dateTo])

  const loadData = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select a date range')
      return
    }

    setLoading(true)
    const result = await getProfitAndLoss({ dateFrom, dateTo })
    if (result.success) {
      setData(result.data)
    } else {
      toast.error('Failed to load profit data')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Loading profit data...</p>
      </div>
    )
  }

  if (!data) return null

  const isProfit = data.profit >= 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-xs font-black uppercase text-green-400">Revenue</p>
          </div>
          <p className="text-3xl font-black text-white">₹{data.revenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-zinc-500 mt-2">{data.bookingCount} completed booking(s)</p>
        </Card>

        {/* Expenses */}
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-xs font-black uppercase text-red-400">Expenses</p>
          </div>
          <p className="text-3xl font-black text-white">₹{data.totalExpenses.toLocaleString('en-IN')}</p>
          <p className="text-xs text-zinc-500 mt-2">{data.expenseCount} expense(s)</p>
        </Card>

        {/* Profit */}
        <Card className={`bg-gradient-to-br ${isProfit ? 'from-primary/10 to-amber-600/5 border-primary/30' : 'from-red-500/10 to-red-600/5 border-red-500/30'} p-6`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg ${isProfit ? 'bg-primary/20' : 'bg-red-500/20'} flex items-center justify-center`}>
              {isProfit ? (
                <TrendingUp className="h-5 w-5 text-primary" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
            </div>
            <p className={`text-xs font-black uppercase ${isProfit ? 'text-primary' : 'text-red-400'}`}>
              {isProfit ? 'Profit' : 'Loss'}
            </p>
          </div>
          <p className={`text-3xl font-black ${isProfit ? 'text-primary' : 'text-red-400'}`}>
            ₹{Math.abs(data.profit).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-zinc-500 mt-2">{isProfit ? 'Making money!' : 'In loss'}</p>
        </Card>

        {/* Profit Margin */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Percent className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-xs font-black uppercase text-blue-400">Profit Margin</p>
          </div>
          <p className="text-3xl font-black text-white">{data.profitMargin.toFixed(1)}%</p>
          <p className="text-xs text-zinc-500 mt-2">Profit per rupee earned</p>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#121212] border-[#27272a] p-6">
          <h3 className="text-sm font-black uppercase text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-primary to-amber-500 rounded-full" />
            Revenue Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-zinc-500">Device Bookings</p>
                <p className="text-sm font-black text-white">₹{data.deviceRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-amber-500"
                  style={{ width: `${data.revenue > 0 ? (data.deviceRevenue / data.revenue) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-zinc-500">Food Sales</p>
                <p className="text-sm font-black text-white">₹{data.foodRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${data.revenue > 0 ? (data.foodRevenue / data.revenue) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <div className="flex justify-between items-center">
                <p className="text-xs font-black text-primary uppercase">Total Revenue</p>
                <p className="text-lg font-black text-primary">₹{data.revenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Profit Chart Placeholder */}
        <Card className="bg-[#121212] border-[#27272a] p-6">
          <h3 className="text-sm font-black uppercase text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-red-500 rounded-full" />
            Profit Overview
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="text-xs text-zinc-400">Revenue</span>
              <span className="text-sm font-black text-green-400">₹{data.revenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-center py-2">
              <span className="text-2xl font-black text-zinc-600">−</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-xs text-zinc-400">Expenses</span>
              <span className="text-sm font-black text-red-400">₹{data.totalExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-center py-2">
              <span className="text-2xl font-black text-zinc-600">=</span>
            </div>
            <div className={`flex items-center justify-between p-4 ${isProfit ? 'bg-primary/10 border-primary/20' : 'bg-red-500/10 border-red-500/20'} border rounded-lg`}>
              <span className={`text-sm font-black uppercase ${isProfit ? 'text-primary' : 'text-red-400'}`}>
                {isProfit ? 'Profit' : 'Loss'}
              </span>
              <span className={`text-xl font-black ${isProfit ? 'text-primary' : 'text-red-400'}`}>
                ₹{Math.abs(data.profit).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card className="bg-gradient-to-br from-[#111] via-zinc-950 to-[#111] border-primary/20 p-6">
        <h3 className="text-sm font-black uppercase text-white mb-4">Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Average Revenue per Booking</p>
            <p className="text-xl font-black text-white">
              ₹{data.bookingCount > 0 ? (data.revenue / data.bookingCount).toFixed(0) : '0'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Device Revenue %</p>
            <p className="text-xl font-black text-white">
              {data.revenue > 0 ? ((data.deviceRevenue / data.revenue) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Food Revenue %</p>
            <p className="text-xl font-black text-white">
              {data.revenue > 0 ? ((data.foodRevenue / data.revenue) * 100).toFixed(1) : '0'}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
