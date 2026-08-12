'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRequiredFields } from '@/lib/hooks/useRequiredFields'

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
  const { formRef, isComplete, recheck } = useRequiredFields()

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
      <DialogContent className="bg-[var(--background)] border-[#27272a] text-white max-w-2xl w-[95vw] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header Panel */}
        <div className="p-6 pr-14 border-b border-zinc-900 bg-[var(--surface)] flex-shrink-0">
          <DialogTitle className="font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-4 bg-primary rounded-sm block shadow-primary" />
            Edit Happy Hour
          </DialogTitle>
          <p className="text-xs text-secondary-content font-semibold mt-0.5 tracking-wide">
            Update the pricing rules and schedule for this promotion.
          </p>
        </div>

        <form ref={formRef} onChange={recheck} onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 p-8 space-y-6 bg-[var(--background)] overflow-y-auto">

            {/* Row 1: Promotion Name (Full Width) */}
            <div className="space-y-2">
              <label className="text-xs font-black tracking-widest uppercase text-zinc-300">Promotion Name <span className="text-red-500">*</span></label>
              <Input
                name="promotionName"
                defaultValue={rule.name}
                className="h-10 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors"
                required
              />
            </div>

            {/* Row 2: Select Days */}
            <div className="space-y-2">
              <label className="text-xs font-black tracking-widest uppercase text-zinc-300">Select Days <span className="text-red-500">*</span></label>
              <div className="flex flex-row justify-between sm:justify-start gap-1 sm:gap-2 mt-1 w-full overflow-x-auto pb-1 no-scrollbar">
                {DAYS_ABBR.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 sm:flex-initial w-9 h-9 min-w-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all border ${
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
                <label className="text-xs font-black tracking-widest uppercase text-zinc-300">Discount (%) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Input
                    type="number"
                    name="discount"
                    defaultValue={rule.discount}
                    min={0}
                    max={100}
                    className="h-10 pr-8 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-content text-sm pointer-events-none">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black tracking-widest uppercase text-zinc-300">Status <span className="text-red-500">*</span></label>
                <select
                  name="status"
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[var(--surface)] px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-white cursor-pointer transition-colors"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black tracking-widest uppercase text-zinc-300">Time Range <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    name="startTime"
                    defaultValue={defaultStart}
                    className="h-10 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                    required
                  />
                  <span className="text-muted-content text-sm">to</span>
                  <Input
                    type="time"
                    name="endTime"
                    defaultValue={defaultEnd}
                    className="h-10 bg-[var(--surface)] border-[#27272a] text-sm text-white focus-visible:ring-primary focus-visible:border-primary transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black tracking-widest uppercase text-zinc-300">Applies To <span className="text-red-500">*</span></label>
                <select
                  name="device"
                  className="flex h-10 w-full rounded-md border border-[#27272a] bg-[var(--surface)] px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-white cursor-pointer transition-colors"
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
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-zinc-900 bg-[var(--surface)] flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="text-muted-content hover:bg-zinc-900 hover:text-white font-black uppercase text-sm tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isComplete || selectedDays.length === 0}
              className="bg-gradient-primary hover:bg-gradient-primary-hover text-[var(--button-text)] font-black uppercase text-sm tracking-wider px-6 h-10 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
