/**
 * OTP Session Management
 *
 * Phone verification via MSG91, and the short-lived session a customer holds
 * afterwards.
 *
 * Two rules govern everything here:
 *
 *  1. A session is proven by presenting its token, never by naming a phone
 *     number. Anything that accepts a phone as proof lets a stranger ride along
 *     on someone else's verification.
 *  2. Nothing reusable is stored. The OTP is kept only as a keyed hash and the
 *     session token only as a digest, so a database read cannot impersonate a
 *     customer.
 */

import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/server';
import { generateOTP, sendOTPViaSMS, validatePhoneNumber } from './msg91';
import crypto from 'crypto';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
const SESSION_EXPIRY_MINUTES = 15;
const MAX_OTP_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');
const MAX_RESEND_COUNT = parseInt(process.env.OTP_MAX_REQUESTS_PER_PHONE || '3');
const RESEND_COOLDOWN_SECONDS = 60;

export interface OTPSessionResult {
  success: boolean;
  message: string;
  expiresAt?: string;
  canResend?: boolean;
  nextResendAt?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  /** Plaintext token. Returned once, for the caller to put in an httpOnly cookie. */
  sessionToken?: string;
  phone?: string;
  sessionExpiresAt?: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  phone?: string;
  sessionExpiresAt?: string;
  message?: string;
}

/**
 * Secret for keying OTP hashes.
 *
 * Required, and deliberately loud when missing. The previous implementation
 * appended `process.env.SESSION_SECRET` straight into a SHA-256 - so an unset
 * variable silently became the literal string "undefined", turning every stored
 * hash into a plain unsalted digest of a six-digit number that any database
 * reader could reverse by trying all million.
 */
function getOtpSecret(): string {
  const secret = process.env.OTP_HASH_SECRET || process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'OTP_HASH_SECRET is missing or too short (needs >= 32 chars). ' +
        'Refusing to hash OTPs with a weak or absent key.'
    );
  }

  return secret;
}

/** Keyed hash of an OTP. HMAC, so the digest cannot be precomputed offline. */
function hashOTP(otp: string): string {
  return crypto.createHmac('sha256', getOtpSecret()).update(otp).digest('hex');
}

/** Session tokens are high-entropy, so a plain digest is enough to look them up. */
function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create an OTP session and send the code by SMS.
 */
export async function createOTPSession(
  phone: string,
  ipAddress?: string,
  userAgent?: string
): Promise<OTPSessionResult> {
  try {
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      return { success: false, message: validation.error || 'Invalid phone number' };
    }

    const cleanPhone = validation.cleanPhone;

    // Rate limit: max 3 requests per phone per hour.
    const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin.rpc(
      'check_otp_rate_limit',
      { p_phone: cleanPhone }
    );

    if (rateLimitError) {
      // Fail closed. A rate limiter that opens up when the database hiccups is
      // an invitation to pump SMS charges.
      console.error('[OTP] Rate limit check failed:', rateLimitError);
      return { success: false, message: 'Could not send OTP right now. Please try again.' };
    }

    if (rateLimitData?.length > 0 && !rateLimitData[0].is_allowed) {
      return {
        success: false,
        message: `Too many OTP requests. Please try again after ${new Date(
          rateLimitData[0].next_allowed_at
        ).toLocaleTimeString()}`,
        canResend: false,
        nextResendAt: rateLimitData[0].next_allowed_at,
      };
    }

    // Resend cooldown.
    const { data: recentSession } = await supabaseAdmin
      .from('otp_sessions')
      .select('otp_sent_at')
      .eq('phone', cleanPhone)
      .eq('is_active', true)
      .gte('created_at', new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentSession?.length > 0) {
      const elapsed = Math.floor(
        (Date.now() - new Date(recentSession[0].otp_sent_at).getTime()) / 1000
      );
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        return {
          success: false,
          message: `Please wait ${RESEND_COOLDOWN_SECONDS - elapsed} seconds before requesting a new OTP`,
          canResend: false,
        };
      }
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const smsResult = await sendOTPViaSMS(cleanPhone, otp);

    if (!smsResult.success) {
      console.error('[OTP] SMS send failed:', smsResult.message);
      return { success: false, message: 'Failed to send OTP. Please try again.' };
    }

    // Retire any earlier session so only the newest code can be redeemed.
    await supabaseAdmin
      .from('otp_sessions')
      .update({ is_active: false })
      .eq('phone', cleanPhone)
      .eq('is_active', true);

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('otp_sessions')
      .insert({
        phone: cleanPhone,
        otp_hash: otpHash,
        otp_sent_at: now.toISOString(),
        otp_expires_at: otpExpiresAt.toISOString(),
        otp_attempts: 0,
        is_active: true,
        is_verified: false,
        resend_count: 0,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('otp_expires_at')
      .single();

    if (sessionError || !session) {
      console.error('[OTP] Failed to create session:', sessionError);
      return { success: false, message: 'Failed to create OTP session. Please try again.' };
    }

    return {
      success: true,
      message: 'OTP sent successfully to your mobile number',
      expiresAt: session.otp_expires_at,
      canResend: true,
    };
  } catch (error) {
    console.error('[OTP] createOTPSession failed:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

/**
 * Verify an OTP and mint a session token.
 *
 * The attempt counter is consumed inside the database under a row lock, so two
 * concurrent guesses cannot share one attempt.
 */
export async function verifyOTP(phone: string, otp: string): Promise<VerifyOTPResult> {
  try {
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      return { success: false, message: validation.error || 'Invalid phone number' };
    }

    if (!/^\d{6}$/.test((otp || '').trim())) {
      return { success: false, message: 'Please enter the 6-digit code.' };
    }

    const cleanPhone = validation.cleanPhone;

    const { data, error } = await supabaseAdmin.rpc('consume_otp_attempt', {
      p_phone: cleanPhone,
      p_otp_hash: hashOTP(otp.trim()),
      p_max_attempts: MAX_OTP_ATTEMPTS,
    });

    if (error || !data?.length) {
      console.error('[OTP] consume_otp_attempt failed:', error);
      return { success: false, message: 'An error occurred during verification. Please try again.' };
    }

    const result = data[0];

    if (result.outcome === 'no_session') {
      return { success: false, message: 'OTP expired or invalid. Please request a new OTP.' };
    }

    if (result.outcome === 'too_many_attempts') {
      return { success: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
    }

    if (result.outcome === 'invalid') {
      const remaining = Math.max(0, result.attempts_remaining);
      return {
        success: false,
        message: remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Maximum OTP attempts exceeded. Please request a new OTP.',
      };
    }

    const sessionToken = generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('otp_sessions')
      .update({
        is_verified: true,
        otp_verified_at: nowIso,
        session_token_hash: hashSessionToken(sessionToken),
        session_created_at: nowIso,
        session_expires_at: sessionExpiresAt.toISOString(),
        session_last_activity: nowIso,
      })
      .eq('id', result.session_id);

    if (updateError) {
      console.error('[OTP] Failed to open session:', updateError);
      return { success: false, message: 'Failed to create session. Please try again.' };
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      sessionToken,
      phone: cleanPhone,
      sessionExpiresAt: sessionExpiresAt.toISOString(),
    };
  } catch (error) {
    console.error('[OTP] verifyOTP failed:', error);
    return { success: false, message: 'An error occurred during verification. Please try again.' };
  }
}

/**
 * Resolve a session token to the phone number it verified.
 *
 * This is the ONLY way to establish who a customer is. There is deliberately no
 * lookup by phone number: the removed `getActiveSessionByPhone()` returned a live
 * session to anyone who typed the right digits, so entering someone else's number
 * inside their 15-minute window skipped verification entirely.
 */
export async function validateSession(
  sessionToken: string
): Promise<SessionValidationResult> {
  try {
    if (!sessionToken) {
      return { isValid: false, message: 'No session token provided' };
    }

    const { data, error } = await supabaseAdmin.rpc('validate_session_token', {
      p_session_token_hash: hashSessionToken(sessionToken),
    });

    if (error || !data?.length || !data[0].is_valid) {
      return {
        isValid: false,
        message: 'Session expired. Please verify your phone number again.',
      };
    }

    return {
      isValid: true,
      phone: data[0].phone,
      sessionExpiresAt: data[0].session_expires_at,
    };
  } catch (error) {
    console.error('[OTP] validateSession failed:', error);
    return { isValid: false, message: 'Failed to validate session' };
  }
}

/**
 * Resend the OTP for a phone number.
 */
export async function resendOTP(
  phone: string,
  ipAddress?: string,
  userAgent?: string
): Promise<OTPSessionResult> {
  try {
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      return { success: false, message: validation.error || 'Invalid phone number' };
    }

    const { data: sessions } = await supabaseAdmin
      .from('otp_sessions')
      .select('id, resend_count')
      .eq('phone', validation.cleanPhone)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessions?.length > 0 && sessions[0].resend_count >= MAX_RESEND_COUNT) {
      return {
        success: false,
        message: 'Maximum resend limit reached. Please try again later.',
        canResend: false,
      };
    }

    // createOTPSession enforces the hourly rate limit and the 60s cooldown.
    const result = await createOTPSession(phone, ipAddress, userAgent);

    if (result.success && sessions?.length > 0) {
      await supabaseAdmin
        .from('otp_sessions')
        .update({
          resend_count: sessions[0].resend_count + 1,
          last_resend_at: new Date().toISOString(),
        })
        .eq('id', sessions[0].id);
    }

    return result;
  } catch (error) {
    console.error('[OTP] resendOTP failed:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('cleanup_expired_otp_sessions');
  if (error) {
    console.error('[OTP] cleanup failed:', error);
    return 0;
  }
  return (data as number) ?? 0;
}
