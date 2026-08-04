interface SendOTPParams {
  phone: string
  otp: string
}

interface SendBookingConfirmationParams {
  phone: string
  bookingId: string
  deviceName: string
  date: string
  time: string
  qrCodeUrl: string
}

interface SendSubscriptionConfirmationParams {
  phone: string
  planName: string
  validUntil: string
  discount: string
}

export async function sendOTP(params: SendOTPParams) {
  const response = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: process.env.MSG91_AUTH_KEY!,
    },
    body: JSON.stringify({
      sender: process.env.MSG91_SENDER_ID,
      mobile: params.phone,
      otp: params.otp,
      template_id: process.env.MSG91_TEMPLATE_ID_OTP,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to send OTP via MSG91')
  }

  return await response.json()
}

export async function sendBookingConfirmation(params: SendBookingConfirmationParams) {
  // TODO: Implement using MSG91 SMS/WhatsApp API
  // Use template_id from MSG91_TEMPLATE_ID_BOOKING
  const message = `✅ Booking confirmed!

Arena OS
${params.deviceName} - ${params.date}, ${params.time}

Booking ID: ${params.bookingId}
View QR: ${params.qrCodeUrl}

See you soon!`

  console.log('SMS would be sent:', message)

  // Placeholder for actual MSG91 API call
  return { success: true, message }
}

export async function sendSubscriptionConfirmation(params: SendSubscriptionConfirmationParams) {
  // TODO: Implement using MSG91 SMS/WhatsApp API
  const message = `✅ Subscription activated!

Arena OS - ${params.planName}
${params.discount} on all bookings
Valid until: ${params.validUntil}

Start booking: ${process.env.NEXT_PUBLIC_APP_URL}/booking`

  console.log('SMS would be sent:', message)

  return { success: true, message }
}

export async function sendEmail(to: string, subject: string, body: string) {
  // TODO: Implement using MSG91 Email API
  console.log('Email would be sent to:', to)
  return { success: true }
}
