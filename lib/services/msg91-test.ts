/**
 * MSG91 Test Mode - For Development Without Real SMS
 *
 * This allows testing OTP flow without MSG91 credentials
 * In test mode, OTP is logged to console instead of sent via SMS
 */

const IS_TEST_MODE = process.env.MSG91_TEST_MODE === 'true';

interface SendOTPResponse {
  success: boolean;
  message: string;
  type?: string;
  request_id?: string;
}

// OTP generation lives in ./msg91 (crypto-backed). This module only handles the
// no-SMS development path, so it must not ship a second, weaker generator.

/**
 * Send OTP in Test Mode (logs to console)
 */
export async function sendOTPViaTestMode(
  phone: string,
  otp: string
): Promise<SendOTPResponse> {
  console.log('='.repeat(60));
  console.log('📱 MSG91 TEST MODE - OTP NOT SENT TO REAL PHONE');
  console.log('='.repeat(60));
  console.log(`Phone: +91 ${phone}`);
  console.log(`OTP: ${otp}`);
  console.log('='.repeat(60));
  console.log('⚠️  In production, set MSG91_TEST_MODE=false and configure MSG91');
  console.log('='.repeat(60));

  return {
    success: true,
    message: `OTP sent successfully (TEST MODE)`,
    type: 'success',
    request_id: `test-${Date.now()}`,
  };
}

/**
 * Check if we're in test mode
 */
export function isTestMode(): boolean {
  return IS_TEST_MODE;
}
