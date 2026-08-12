'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Update this path to match your actual actions file
import { getDevices, updateHappyHour } from './action' 

interface EditModalProps {
  rule: any
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

// Convert 12-hour time (06:00 PM) to 24-hour format (18:00) for input field
function convertTo24Hour(time12: string): string {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return '00:00'

  let [, hours, minutes, period] = match
  let hour = parseInt(hours)

  if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12
  if (period.toUpperCase() === 'AM' && hour === 12) hour = 0

  return `${hour.toString().padStart(2, '0')}:${minutes}`
}

export function EditHappyHourModal({ rule, open, setOpen, onFormSuccess }: EditModalProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch devices and parse existing rule data
  useEffect(() => {
    if (open && rule) {
      // 1. Fetch the dynamic device list
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

      // 2. Parse the saved 'schedule' string back into numeric indices
      if (rule.schedule) {
        const savedDays = rule.schedule.split(', ')
        const indices = savedDays.map((d: string) => DAYS_FULL.indexOf(d)).filter((i: number) => i !== -1)
        setSelectedDays(indices)
      }
    }
  }, [open, rule])

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
      // 1. Gather all form data
      const formData = new FormData(e.currentTarget)
      const promotionName = formData.get('promotionName') as string
      const discount = Number(formData.get('discount'))
      const startTime = formData.get('startTime') as string
      const endTime = formData.get('endTime') as string
      const deviceId = formData.get('device') as string
      const status = formData.get('status') as 'LIVE' | 'PAUSED' | 'SCHEDULED' // Extract Status

      // 2. Format specific fields for the database
      const scheduleString = selectedDays
        .sort((a, b) => a - b)
        .map(idx => DAYS_FULL[idx])
        .join(', ')

      // Convert 24-hour time to 12-hour format with AM/PM
      const startTime12 = convertTo12Hour(startTime)
      const endTime12 = convertTo12Hour(endTime)
      const timeRangeString = `${startTime12} - ${endTime12}`

      // Get the selected device name/label
      const selectedDeviceObj = devices.find(d => d.id === deviceId)
      const deviceLabel = selectedDeviceObj 
        ? `Station ${selectedDeviceObj.station_number} ${selectedDeviceObj.device_type?.name ? `(${selectedDeviceObj.device_type.name})` : ''}`
        : 'All PC Stations'

      // 3. Construct the payload
      const payload = {
        name: promotionName,
        discount: discount,
        devices: deviceLabel, 
        schedule: scheduleString,
        time_range: timeRangeString,
        status: status // Pass updated status
      }

      // 4. Send the update to the database using the rule's ID
      const result = await updateHappyHour(rule.id, payload)

      if (result.success) {
        toast.success("Happy Hour rule updated successfully!")
        onFormSuccess()
        setOpen(false)
      } else {
        toast.error("Failed to update rule", { description: result.error })
      }

    } catch (error: any) {
      toast.error("An unexpected error occurred.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!rule) return null

  // --- Parsing Default Values for the Form ---
  
  // Extract start and end times from "HH:MM AM/PM - HH:MM AM/PM" format
  // Convert to 24-hour format for the time input fields
  let defaultStart = "00:00"
  let defaultEnd = "00:00"
  if (rule?.time_range && rule.time_range.includes(' - ')) {
    const parts = rule.time_range.split(' - ')
    defaultStart = convertTo24Hour(parts[0].trim())
    defaultEnd = convertTo24Hour(parts[1].trim())
  }

  // Find the matching device ID based on the saved string label to set the dropdown default value
  let defaultDeviceId = 'all'
  if (rule?.devices !== 'All PC Stations') {
    const matchedDevice = devices.find(d => {
      const label = `Station ${d.station_number} ${d.device_type?.name ? `(${d.device_type.name})` : ''}`
      return label === rule.devices
    })
    if (matchedDevice) defaultDeviceId = matchedDevice.id
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && setOpen(val)}>
      <DialogContent className="bg-[#1e1e1e] border border-[#333] text-white w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-xl shadow-2xl">
        <DialogHeader className="mb-2 md:mb-4">
          <DialogTitle className="text-primary text-xl md:text-2xl font-bold">Edit Happy Hour</DialogTitle>
          <DialogDescription className="text-[#a1a1aa] text-sm">
            Update the pricing rules and schedule for this promotion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          
          {/* Row 1: Promotion Name (Full Width) */}
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Promotion Name</label>
            <input 
              type="text" 
              name="promotionName"
              defaultValue={rule.name} 
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
                      ? 'border-[var(--primary)] text-primary bg-primary/10' 
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
                  defaultValue={rule.discount} 
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
                defaultValue={rule.status || "SCHEDULED"}
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
                  defaultValue={defaultStart}
                  className="w-full bg-[var(--surface)] border border-[#333] text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[var(--primary)] text-sm [&::-webkit-calendar-picker-indicator]:invert" 
                  required
                />
                <span className="text-[#a1a1aa] text-sm">to</span>
                <input 
                  type="time" 
                  name="endTime"
                  defaultValue={defaultEnd}
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
                defaultValue={defaultDeviceId}
                key={defaultDeviceId} // Adding key forces React to re-render the select default value once devices load
              >
                <option value="all">All PC Stations</option>
                {isLoadingDevices ? (
                  <option value="loading" disabled>Loading devices...</option>
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
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'SAVE CHANGES'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}