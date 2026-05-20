import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RetrieveBookingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Retrieve Booking</CardTitle>
          <CardDescription>TODO: Junior Developer - Booking retrieval flow</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phone + OTP → Show bookings → Display QR codes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
