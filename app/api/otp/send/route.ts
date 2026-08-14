import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/redis/client'
import { generateOTP } from '@/lib/utils/otp'
import { sendOTP } from '@/lib/msg91/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { normalizeIndianMobile } from '@/lib/utils/forms'

export async function POST(request: NextRequest) {
  try {
    const { phone: rawPhone } = await request.json()

    // Ten digits alone lets 0000000000 through and an OTP goes nowhere. This also
    // strips any +91/0 prefix, so the rate-limit key and the stored number are the
    // same string however the customer typed it.
    const phone = normalizeIndianMobile(rawPhone)

    if (!phone) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      )
    }

    // Rate limiting: max 3 OTP requests per phone per 5 minutes
    const rateLimitKey = `otp:send:${phone}`
    const { allowed, remaining } = await checkRateLimit(rateLimitKey, 3, 300)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5')
    const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000)

    // Store OTP in database
    const { error: dbError } = await supabaseAdmin
      .from('otps')
      .insert({
        phone,
        otp,
        expires_at: expiryTime.toISOString(),
        attempts: 0,
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      )
    }

    // Send OTP via MSG91
    await sendOTP({ phone, otp })

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      remaining,
      expiresIn: expiryMinutes * 60, // seconds
    })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
