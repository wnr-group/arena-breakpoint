'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
      
      const timeRangeString = `${startTime} - ${endTime}`

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
      <DialogContent className="bg-[#1e1e1e] border border-[#333] text-white w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-xl shadow-2xl">
        <DialogHeader className="mb-2 md:mb-4">
          <DialogTitle className="text-primary text-xl md:text-2xl font-bold">Add Happy Hour</DialogTitle>
          <DialogDescription className="text-[#a1a1aa] text-sm">
            Define new peak-time promotional pricing rules.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          
          {/* Row 1: Promotion Name (Full Width) */}
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Promotion Name</label>
            <input 
              type="text" 
              name="promotionName"
              placeholder="e.g. Flash Friday" 
              className="w-full bg-[var(--surface)] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-sm" 
              required 
            />
          </div>

          {/* Row 2: Select Days (Dedicated Single-Row Container) */}
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Select Days</label>
            <div className="flex flex-row justify-between sm:justify-start gap-1 sm:gap-2 mt-1 w-full overflow-x-auto pb-1 no-scrollbar">
              {DAYS_ABBR.map((day, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={() => toggleDay(idx)} 
                  className={`flex-1 sm:flex-initial w-9 h-9 min-w-8 flex items-center justify-center rounded-lg text-xs md:text-sm font-medium transition-colors border ${
                    selectedDays.includes(idx) 
                      ? 'border-[var(--primary)] text-primary bg-gradient-primary/10' 
                      : 'border-[#333] text-[#a1a1aa] bg-[var(--surface)] hover:border-gray-500'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Discount & Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Discount (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  name="discount"
                  defaultValue={20} 
                  min={0}
                  max={100}
                  className="w-full bg-[var(--surface)] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-sm" 
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] text-sm">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Status</label>
              <select 
                name="status"
                className="w-full bg-[var(--surface)] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--primary)] appearance-none text-sm"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Time Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  name="startTime"
                  className="w-full bg-[var(--surface)] border border-[#333] text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[var(--primary)] text-sm [&::-webkit-calendar-picker-indicator]:invert" 
                  required 
                />
                <span className="text-[#a1a1aa] text-sm">to</span>
                <input 
                  type="time" 
                  name="endTime"
                  className="w-full bg-[var(--surface)] border border-[#333] text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[var(--primary)] text-sm [&::-webkit-calendar-picker-indicator]:invert" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Applies To</label>
              <select 
                name="device"
                className="w-full bg-[var(--surface)] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--primary)] appearance-none text-sm"
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

          {/* Footer Buttons */}
          <DialogFooter className="mt-8 flex flex-col-reverse md:flex-row gap-3 sm:justify-end border-t border-[#333] pt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              disabled={isSubmitting}
              className="w-full md:w-auto text-white bg-[#2a2a2a] hover:bg-[#333] font-semibold"
            >
              CANCEL
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto bg-gradient-primary text-black hover:bg-gradient-primary-hover font-bold px-6 flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : '+ ADD HAPPY HOURS'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}