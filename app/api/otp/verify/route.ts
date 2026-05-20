import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSessionToken } from '@/lib/utils/otp'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone and OTP are required' },
        { status: 400 }
      )
    }

    // Fetch OTP record
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('phone', phone)
      .eq('otp', otp)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'OTP expired' },
        { status: 400 }
      )
    }

    // Check attempts
    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3')
    if (otpRecord.attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Too many attempts. Request new OTP.' },
        { status: 400 }
      )
    }

    // OTP is valid, create session
    const sessionToken = generateSessionToken()
    const sessionExpiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS || '7')
    const expiryDate = new Date(Date.now() + sessionExpiryDays * 24 * 60 * 60 * 1000)

    // Store session
    await supabaseAdmin.from('sessions').insert({
      phone,
      token: sessionToken,
      expires_at: expiryDate.toISOString(),
    })

    // Delete used OTP
    await supabaseAdmin.from('otps').delete().eq('id', otpRecord.id)

    // Check for active subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'active')
      .gte('valid_until', new Date().toISOString())
      .single()

    const response = NextResponse.json({
      success: true,
      session: {
        token: sessionToken,
        phone,
        expiresAt: expiryDate.toISOString(),
      },
      subscription: subscription || null,
    })

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionExpiryDays * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
