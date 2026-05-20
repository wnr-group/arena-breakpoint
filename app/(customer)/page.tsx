import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Break Point Arena</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Book your gaming slot and start playing!
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/booking">Book Gaming Slot</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/subscription">View Subscriptions</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Booking</CardTitle>
            <CardDescription>
              Book your slot in under 2 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Select your device, pick a time slot, and pay securely with Razorpay.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code Entry</CardTitle>
            <CardDescription>
              Scan and play at the café
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receive a QR code via SMS and scan it at the counter when you arrive.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>
              Save on every booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Subscribe and get automatic discounts on all your bookings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retrieve Booking</CardTitle>
            <CardDescription>
              Lost your QR? No problem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enter your phone number to retrieve your booking and QR code anytime.
            </p>
            <Button asChild variant="link" className="mt-2 px-0">
              <Link href="/retrieve">Retrieve Booking</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
