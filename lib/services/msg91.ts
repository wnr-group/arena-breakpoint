/**
 * MSG91 SMS and OTP Service
 *
 * Handles OTP sending via MSG91 API
 * Documentation: https://docs.msg91.com/p/tf9GTextN/e/Oq3uX4zUm/MSG91
 */

import crypto from 'crypto';
import { isTestMode, sendOTPViaTestMode } from './msg91-test';

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

  // Remove +91 or 91 prefix if present
  cleanPhone = cleanPhone.replace(/^\+?91/, '');

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
