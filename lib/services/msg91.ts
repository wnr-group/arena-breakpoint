/**
 * MSG91 SMS and OTP Service
 *
 * Handles OTP sending via MSG91 API
 * Documentation: https://docs.msg91.com/p/tf9GTextN/e/Oq3uX4zUm/MSG91
 */

import crypto from 'crypto';
import { isTestMode, isLiveSmsAllowed, sendOTPViaTestMode } from './msg91-test';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'BRKPNT';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID_OTP;
const MSG91_BASE_URL = 'https://control.msg91.com/api/v5';
const USE_SENDOTP_API = process.env.MSG91_USE_SENDOTP_API === 'true'; // Toggle between Flow API and SendOTP API

interface SendOTPResponse {
  success: boolean;
  message: string;
  type?: string;
  request_id?: string;
}

interface MSG91ErrorResponse {
  message: string;
  type: string;
}

/**
 * Generate a 6-digit OTP.
 *
 * crypto.randomInt, not Math.random: Math.random is a seeded PRNG whose output
 * is predictable from prior values, which is not a property you want in the only
 * thing standing between a stranger and someone else's phone number.
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Send OTP via MSG91 SMS API
 * Using the Flow API for template-based OTP
 */
export async function sendOTPViaSMS(
  phone: string,
  otp: string
): Promise<SendOTPResponse> {
  try {
    // Check if we're in test mode
    if (isTestMode()) {
      return await sendOTPViaTestMode(phone, otp);
    }

    if (!MSG91_AUTH_KEY) {
      console.error('[MSG91] AUTH_KEY not configured');
      return {
        success: false,
        message: 'MSG91 configuration missing. Please contact support.',
      };
    }

    // Remove +91 if present, MSG91 expects 10-digit number
    const cleanPhone = phone.replace(/^\+?91/, '').trim();

    if (cleanPhone.length !== 10) {
      return {
        success: false,
        message: 'Invalid phone number format. Must be 10 digits.',
      };
    }

    // Allowlist check sits after validation and before the paid API call, so a
    // development run can exercise the whole flow while spending credits on one
    // handset only. No-op when MSG91_LIVE_SMS_NUMBERS is unset.
    if (!isLiveSmsAllowed(cleanPhone)) {
      return await sendOTPViaTestMode(cleanPhone, otp, 'not-allowlisted');
    }

    console.log(`[MSG91] Sending OTP to ${cleanPhone}`);

    // Choose API based on configuration
    if (USE_SENDOTP_API) {
      // Use SendOTP API (simpler, no template needed)
      const response = await fetch(`https://control.msg91.com/api/v5/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          mobile: `91${cleanPhone}`,
          otp: otp,
          otp_expiry: 5, // 5 minutes
          template_id: MSG91_TEMPLATE_ID, // Optional
          /**
           * Only the OTP is passed. The MSG91 template briefly carried a second
           * variable, "##var1##", tacked on after the website URL that DLT had
           * insisted the content contain. DLT itself approved the URL as static
           * text, so that variable existed on MSG91's side and nowhere else - the
           * outbound message went out with the literal characters "##var1##" in it,
           * did not match the approved content, and was dropped.
           *
           * The template has since been corrected to end at the URL. Nothing here
           * should supply a variable the approved content does not define.
           */
        }),
      });

      const data = await response.json();

      if (response.ok && data.type === 'success') {
        console.log('[MSG91] OTP sent successfully via SendOTP API:', data);
        return {
          success: true,
          message: 'OTP sent successfully',
          request_id: data.request_id,
          type: data.type,
        };
      } else {
        console.error('[MSG91] Failed to send OTP via SendOTP API:', data);
        return {
          success: false,
          message: data.message || 'Failed to send OTP',
          type: data.type,
        };
      }
    } else if (MSG91_TEMPLATE_ID) {
      // Use MSG91 Flow API (Template-based SMS)
      const response = await fetch(`${MSG91_BASE_URL}/flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          template_id: MSG91_TEMPLATE_ID,
          sender: MSG91_SENDER_ID,
          short_url: '0',
          mobiles: `91${cleanPhone}`, // MSG91 expects country code + number
          OTP: otp, // Variable that will be replaced in template
        }),
      });

      const data = await response.json();

      if (response.ok && data.type === 'success') {
        console.log('[MSG91] OTP sent successfully:', data);
        return {
          success: true,
          message: 'OTP sent successfully',
          request_id: data.request_id,
          type: data.type,
        };
      } else {
        console.error('[MSG91] Failed to send OTP:', data);
        return {
          success: false,
          message: data.message || 'Failed to send OTP',
          type: data.type,
        };
      }
    } else {
      // Fallback: Use SendOTP API (simpler but requires SendOTP product)
      const response = await fetch(`https://control.msg91.com/api/v5/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          template_id: MSG91_TEMPLATE_ID || undefined,
          mobile: `91${cleanPhone}`,
          otp: otp,
          otp_expiry: 5, // 5 minutes
        }),
      });

      const data = await response.json();

      if (response.ok && data.type === 'success') {
        console.log('[MSG91] OTP sent successfully via SendOTP API:', data);
        return {
          success: true,
          message: 'OTP sent successfully',
          request_id: data.request_id,
          type: data.type,
        };
      } else {
        console.error('[MSG91] Failed to send OTP via SendOTP API:', data);
        return {
          success: false,
          message: data.message || 'Failed to send OTP',
          type: data.type,
        };
      }
    }
  } catch (error) {
    console.error('[MSG91] Exception while sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
    };
  }
}

/**
 * Send SMS notification (non-OTP messages)
 * For booking confirmations, subscription confirmations, etc.
 */
export async function sendSMS(
  phone: string,
  message: string,
  templateId?: string
): Promise<SendOTPResponse> {
  try {
    if (!MSG91_AUTH_KEY) {
      console.error('[MSG91] AUTH_KEY not configured');
      return {
        success: false,
        message: 'MSG91 configuration missing',
      };
    }

    const cleanPhone = phone.replace(/^\+?91/, '').trim();

    const response = await fetch(`${MSG91_BASE_URL}/flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        template_id: templateId || MSG91_TEMPLATE_ID,
        sender: MSG91_SENDER_ID,
        short_url: '0',
        mobiles: `91${cleanPhone}`,
        message: message,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[MSG91] SMS sent successfully');
      return {
        success: true,
        message: 'SMS sent successfully',
        request_id: data.request_id,
      };
    } else {
      console.error('[MSG91] Failed to send SMS:', data);
      return {
        success: false,
        message: data.message || 'Failed to send SMS',
      };
    }
  } catch (error) {
    console.error('[MSG91] Exception while sending SMS:', error);
    return {
      success: false,
      message: 'Failed to send SMS',
    };
  }
}

/**
 * Validate phone number format for India
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  cleanPhone: string;
  error?: string;
} {
  // Remove spaces, dashes, and other characters
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  /**
   * Strip the country code, but only where it really is one.
   *
   * `replace(/^\+?91/, '')` took the leading 91 off any number that happened to
   * start with it, and 91 is a live Indian mobile prefix - 9123456789 became
   * 23456789 and was rejected as "must be 10 digits". Every customer on a
   * 91xxxxxxxx number was locked out of logging in.
   *
   * An explicit `+` is unambiguous. Without one, 91 is only a country code when
   * what follows it is a full 10-digit number.
   */
  if (cleanPhone.startsWith('+91')) {
    cleanPhone = cleanPhone.slice(3);
  } else if (/^91\d{10}$/.test(cleanPhone)) {
    cleanPhone = cleanPhone.slice(2);
  } else if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.slice(1);
  }

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(cleanPhone)) {
    return {
      isValid: false,
      cleanPhone: cleanPhone,
      error: 'Phone number must be 10 digits',
    };
  }

  // Check if it starts with valid Indian mobile prefix (6-9)
  if (!/^[6-9]/.test(cleanPhone)) {
    return {
      isValid: false,
      cleanPhone: cleanPhone,
      error: 'Invalid Indian mobile number',
    };
  }

  return {
    isValid: true,
    cleanPhone: cleanPhone,
  };
}
