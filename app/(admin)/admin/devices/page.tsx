'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Monitor,
  CheckCircle,
  PlayCircle,
  Wrench,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MonitorPlay,
} from 'lucide-react'
import { deleteDevice, getDevices } from './actions'
import { DeviceFilters } from '@/components/admin/devices/DeviceFilters'
import { AddDeviceModal } from '@/components/admin/devices/AddDeviceModal'
import { EditDeviceModal } from '@/components/admin/devices/EditDeviceModal'
import { DeviceTable } from '@/components/admin/devices/DeviceTable'
import { DeviceGrid } from '@/components/admin/devices/DeviceGrid'
import { toast } from 'sonner'

export default function DevicesPage() {
  const [isPending, startTransition] = useTransition()
  const [devicesArray, setDevicesArray] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // --- CONTROLLER UI STATES ---
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeTab, setTypeTab] = useState('All Devices')
  const [statusFilter, setStatusFilter] = useState('All')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<any | null>(null)

  // --- CLIENT-SIDE DATA FETCH ---
  const fetchFreshDevices = async () => {
    setIsLoadingData(true)
    try {
      const data = await getDevices()
      setDevicesArray(data || [])
    } catch (err) {
      console.error('Failed loading inventory:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    fetchFreshDevices()
  }, [])

  // --- DATA FILTER MATRIX ---
  const filteredDevices = useMemo(() => {
    return devicesArray.filter(device => {
      if (!device) return false

      const stationNumber = String(device.station_number || '')
        .toLowerCase()
        .trim()
      const deviceType = String(device.type || '')
        .toLowerCase()
        .trim()
      const deviceStatus = String(device.status || '')
        .toLowerCase()
        .trim()
      const search = searchQuery.toLowerCase().trim()

      const matchesSearch =
        search === '' || stationNumber.includes(search) || deviceType.includes(search)

      let matchesType = false
      const activeTab = typeTab.toLowerCase().trim()

      if (activeTab === 'all devices') {
        matchesType = true
      } else if (activeTab === 'ps5') {
        matchesType = deviceType === 'ps5' || deviceType.includes('playstation')
      } else {
        matchesType = deviceType === activeTab
      }

      const matchesStatus =
        statusFilter === 'All' || deviceStatus === statusFilter.toLowerCase().trim()

      return matchesSearch && matchesType && matchesStatus
    })
  }, [devicesArray, searchQuery, typeTab, statusFilter])

  const devicesForCounting = useMemo(() => {
    return typeTab.toLowerCase().trim() === 'all devices'
      ? devicesArray
      : devicesArray.filter(d => {
          const t = String(d?.type || '').toLowerCase()
          return typeTab.toLowerCase().trim() === 'ps5'
            ? t === 'ps5' || t.includes('playstation')
            : t === typeTab.toLowerCase().trim()
        })
  }, [devicesArray, typeTab])

  const totalDevices = devicesForCounting.reduce((acc, d) => acc + (Number(d.quantity) || 1), 0)

  const availableDevices = devicesForCounting
    .filter(d => String(d?.status).toLowerCase() === 'available')
    .reduce((acc, d) => acc + (Number(d.quantity) || 1), 0)

  const occupiedDevices = devicesForCounting
    .filter(d => String(d?.status).toLowerCase() === 'occupied')
    .reduce((acc, d) => acc + (Number(d.quantity) || 1), 0)

  const maintenanceDevices = devicesForCounting
    .filter(d => String(d?.status).toLowerCase() === 'maintenance')
    .reduce((acc, d) => acc + (Number(d.quantity) || 1), 0)

  const inactiveDevices = devicesForCounting
    .filter(d => String(d?.status).toLowerCase() === 'inactive')
    .reduce((acc, d) => acc + (Number(d.quantity) || 1), 0)

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteDevice(id)
      if (res.success) {
        toast.success('Terminal Record Deleted', {
          description: 'The hardware machine has been removed from inventory.',
          icon: <CheckCircle2 className="h-5 w-5 text-[#FFC107]" />,
        })
        await fetchFreshDevices()
      } else {
        toast.error('Deletion Failed', {
          description: res.error,
          icon: <AlertCircle className="h-5 w-5 text-[#f43f5e]" />,
        })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 p-8 bg-[#0a0a0a] min-h-screen text-white animate-in fade-in duration-700">
      {/* HEADER PANELS */}
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1 animate-in slide-in-from-left-4 duration-500">
          <h1 className="text-2xl font-bold tracking-tight text-white">Devices Management</h1>
          <p className="text-[#a1a1aa] text-sm">
            Manage all gaming platforms, stations and availability across the arena.
          </p>
        </div>

        <AddDeviceModal onFormSuccess={fetchFreshDevices} open={isAddOpen} setOpen={setIsAddOpen} />
      </div>

      {/* METRIC DISPLAY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
        {[
          { title: 'Total', count: totalDevices, label: 'Total Asset Range', icon: Monitor },
          {
            title: 'Online',
            count: availableDevices,
            label: 'Available Now',
            icon: CheckCircle,
            color: 'text-[#FFC107]',
          },
          { title: 'Busy', count: occupiedDevices, label: 'Currently Occupied', icon: PlayCircle },
          { title: 'Alert', count: maintenanceDevices, label: 'Under Maintenance', icon: Wrench },
          {
            title: 'Offline',
            count: inactiveDevices,
            label: 'Deactivated Stations',
            icon: MonitorPlay,
            color: 'text-zinc-500',
          },
        ].map(stat => (
          <Card
            key={stat.title}
            className="bg-[#121212] border-[#27272a] hover:border-[#FFC107]/70 hover:-translate-y-1 transition-all duration-500 group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <stat.icon className="h-5 w-5 text-[#FFC107] group-hover:scale-110 transition-transform duration-500" />
              <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">
                {stat.title}
              </span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl lg:text-3xl font-bold mb-1 ${stat.color || 'text-white'}`}>
                {stat.count}
              </div>
              <p className="text-xs text-[#a1a1aa] truncate">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FILTER TOOLBAR */}
      <DeviceFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeTab={typeTab}
        setTypeTab={setTypeTab}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* VIEW SELECTION ROUTER LAYER */}
      <div className="mt-2 animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
        {isLoadingData ? (
          <div className="text-center py-12 bg-[#121212] border border-[#27272a] rounded-xl text-[#a1a1aa] flex justify-center items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#FFC107]" /> Fetching device records...
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="text-center py-12 bg-[#121212] border border-[#27272a] rounded-xl text-[#a1a1aa]">
            No terminal records match your active search constraints.
          </div>
        ) : viewMode === 'table' ? (
          <DeviceTable
            devices={filteredDevices}
            onEdit={setEditingDevice}
            onDelete={handleDelete}
            isPending={isPending}
          />
        ) : (
          <DeviceGrid
            devices={filteredDevices}
            onEdit={setEditingDevice}
            onDelete={handleDelete}
            isPending={isPending}
          />
        )}
      </div>

      {/* COMPACT INTERACTIVE EDIT OVERLAY */}
      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          onFormSuccess={() => {
            setEditingDevice(null)
            fetchFreshDevices()
          }}
          onClose={() => setEditingDevice(null)}
        />
      )}
    </div>
  )
}

// Global Exported StatusBadge used by sub-modules
export function StatusBadge({ status }: { status: string }) {
  const clean = String(status || '')
    .toLowerCase()
    .trim()
  if (clean === 'available')
    return (
      <span className="inline-flex px-2 py-1 text-[10px] font-bold text-[#FFC107] border border-[#FFC107]/30 rounded uppercase bg-[#FFC107]/5 shadow-[0_0_10px_rgba(255,193,7,0.1)]">
        Available
      </span>
    )
  if (clean === 'occupied')
    return (
      <span className="inline-flex px-2 py-1 text-[10px] font-bold text-[#a1a1aa] border border-[#a1a1aa]/30 rounded uppercase bg-[#a1a1aa]/5">
        Occupied
      </span>
    )
  if (clean === 'maintenance')
    return (
      <span className="inline-flex px-2 py-1 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">
        Maintenance
      </span>
    )
  return (
    <span className="inline-flex px-2 py-1 text-[10px] font-bold text-zinc-500 border border-zinc-700 rounded uppercase">
      Inactive
    </span>
  )
}
