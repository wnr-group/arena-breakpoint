import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DevicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Devices</h2>
          <p className="text-muted-foreground">
            Manage gaming devices and availability
          </p>
        </div>
        <Button>Add Device</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device List</CardTitle>
          <CardDescription>TODO: Junior Developer - Display devices table</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fetch devices from Supabase, display with status, pricing, and actions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
