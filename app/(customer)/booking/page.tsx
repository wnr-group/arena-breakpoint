import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BookingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Book Gaming Slot</CardTitle>
          <CardDescription>TODO: Junior Developer - Implement booking flow</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Steps: Device Selection → Slot Selection → Add-ons → Pricing → OTP → Payment → Confirmation
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
