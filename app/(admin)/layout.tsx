import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>
        <nav className="space-y-1 p-4">
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/admin/devices">Devices</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/admin/bookings">Bookings</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/admin/subscriptions">Subscriptions</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/admin/promo-codes">Promo Codes</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/admin/qr-scanner">QR Scanner</Link>
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="flex h-16 items-center border-b px-6">
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-2xl font-bold">Break Point Arena</h1>
            <Button variant="outline">Logout</Button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
