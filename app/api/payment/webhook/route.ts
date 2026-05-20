import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { sendBookingConfirmation } from '@/lib/msg91/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      body.order_id,
      body.payment_id,
      signature
    )

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Payment verified, update booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_id: body.payment_id,
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', body.order_id)
      .select()
      .single()

    if (bookingError || !booking) {
      console.error('Failed to update booking:', bookingError)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Send confirmation SMS
    await sendBookingConfirmation({
      phone: booking.phone,
      bookingId: booking.booking_id,
      deviceName: booking.device_name,
      date: booking.slot_date,
      time: booking.slot_time,
      qrCodeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.booking_id}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
