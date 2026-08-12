'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { getDevices, addHappyHour } from './action'

interface AddModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  onFormSuccess: () => void
}

const DAYS_ABBR = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAYS_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Convert 24-hour time (18:00) to 12-hour format (06:00 PM)
function convertTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function AddHappyHourModal({ open, setOpen, onFormSuccess }: AddModalProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([4]) // Default to Friday

  const [devices, setDevices] = useState<any[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const loadDevices = async () => {
        setIsLoadingDevices(true)
        try {
          const data = await getDevices()
          setDevices(data)
        } catch (error) {
          console.error('Failed to load devices:', error)
          toast.error("Failed to fetch available devices.")
        } finally {
          setIsLoadingDevices(false)
        }
      }

      loadDevices()
      setSelectedDays([4])
    }
  }, [open])

  const toggleDay = (index: number) => {
    setSelectedDays(prev => prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedDays.length === 0) {
      toast.error("Please select at least one day for the promotion.")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const promotionName = formData.get('promotionName') as string
      const discount = Number(formData.get('discount'))
      const startTime = formData.get('startTime') as string
      const endTime = formData.get('endTime') as string
      const deviceId = formData.get('device') as string
      const status = formData.get('status') as 'LIVE' | 'PAUSED' | 'SCHEDULED'

      const scheduleString = selectedDays
        .sort((a, b) => a - b)
        .map(idx => DAYS_FULL[idx])
        .join(', ')

      // Convert 24-hour time to 12-hour format with AM/PM
      const startTime12 = convertTo12Hour(startTime)
      const endTime12 = convertTo12Hour(endTime)
      const timeRangeString = `${startTime12} - ${endTime12}`

      const selectedDeviceObj = devices.find(d => d.id === deviceId)
      const deviceLabel = selectedDeviceObj
        ? `Station ${selectedDeviceObj.station_number} ${selectedDeviceObj.device_type?.name ? `(${selectedDeviceObj.device_type.name})` : ''}`
        : 'All PC Stations'

      const payload = {
        name: promotionName,
        discount: discount,
        devices: deviceLabel,
        schedule: scheduleString,
        time_range: timeRangeString,
        status: status
      }

      const result = await addHappyHour(payload)

      if (result.success) {
        toast.success("Happy Hour rule created successfully!")
        onFormSuccess()
        setOpen(false)
      } else {
        toast.error("Failed to create rule", { description: result.error })
      }

    } catch (error: any) {
      toast.error("An unexpected error occurred.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && setOpen(val)}>
      <DialogContent className="bg-[var(--background)] border-[#27272a] text-white max-w-2xl w-[95vw] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header Panel */}
        <div className="p-6 pr-14 border-b border-zinc-900 bg-[var(--surface)] flex-shrink-0">
          <DialogTitle className="font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-4 bg-primary rounded-sm block shadow-primary" />
            Add Happy Hour
          </DialogTitle>
          <p className="text-[11px] text-secondary-content font-semibold mt-0.5 tracking-wide">
            Define new peak-time promotional pricing rules.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 p-8 space-y-6 bg-[var(--background)] overflow-y-auto">

            {/* Row 1: Promotion Name (Full Width) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Promotion Name</label>
              <Input
                name="promotionName"
                placeholder="e.g. Flash Friday"
                className="h-10 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors"
                required
              />
            </div>

            {/* Row 2: Select Days */}
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Select Days</label>
              <div className="flex flex-row justify-between sm:justify-start gap-1 sm:gap-2 mt-1 w-full overflow-x-auto pb-1 no-scrollbar">
                {DAYS_ABBR.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 sm:flex-initial w-9 h-9 min-w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                      selectedDays.includes(idx)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[#27272a] bg-[var(--surface)] text-muted-content hover:border-zinc-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Discount & Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Discount (%)</label>
                <div className="relative">
                  <Input
                    type="number"
                    name="discount"
                    defaultValue={20}
                    min={0}
                    max={100}
                    className="h-10 pr-8 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-content text-sm pointer-events-none">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Status</label>
                <select
                  name="status"
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[var(--surface)] px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-white cursor-pointer transition-colors"
                  required
                  defaultValue="SCHEDULED"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>
            </div>

            {/* Row 4: Time Range & Applies To Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Time Range</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    name="startTime"
                    className="h-10 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                    required
                  />
                  <span className="text-muted-content text-sm">to</span>
                  <Input
                    type="time"
                    name="endTime"
                    className="h-10 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Applies To</label>
                <select
                  name="device"
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[var(--surface)] px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-white cursor-pointer transition-colors"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>Select a device/station</option>
                  <option value="all">All PC Stations</option>
                  {isLoadingDevices ? (
                    <option value="" disabled>Loading devices...</option>
                  ) : (
                    devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        Station {device.station_number} {device.device_type?.name ? `(${device.device_type.name})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-zinc-900 bg-[var(--surface)] flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="text-muted-content hover:bg-zinc-900 hover:text-white font-black uppercase text-xs tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase text-xs tracking-wider px-6 h-10 rounded-lg shadow-md transition-all"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
