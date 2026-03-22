/**
 * SMS Templates – Pre-formatted SMS messages with authentication markers.
 * All templates automatically include security markers (SEC-008).
 * Location: src/lib/sms-templates/templates.ts
 */

import { formatSMSWithAuthMarkers } from './authentication-marker';

/**
 * Generate voucher issuance SMS notification.
 * Format: [KETCHUP OFFICIAL] Voucher N$250 issued. Code: ABC-123. Valid until Mar 25. Never share PIN. Report fraud: 081-234-5678
 */
export function generateVoucherIssuanceSMS(options: {
  amount: string; // e.g., "N$250"
  voucherCode: string; // e.g., "ABC-123"
  expiryDate: string; // e.g., "Mar 25"
}): string {
  const message = `Voucher ${options.amount} issued. Code: ${options.voucherCode}. Valid until ${options.expiryDate}.`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generate fraud alert SMS.
 * Format: [KETCHUP OFFICIAL] Suspicious activity detected. Call us: 061-123-4567. Never share PIN. Report fraud: 081-234-5678
 */
export function generateFraudAlertSMS(options: {
  alertType?: 'suspicious_login' | 'unusual_activity' | 'multiple_attempts';
  contactNumber?: string;
}): string {
  const alerts = {
    suspicious_login: 'Suspicious login detected',
    unusual_activity: 'Unusual activity detected',
    multiple_attempts: 'Multiple failed login attempts',
  };
  
  const alertText = options.alertType ? alerts[options.alertType] : 'Suspicious activity detected';
  const contact = options.contactNumber || '061-123-4567';
  
  const message = `${alertText}. Call us: ${contact}.`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generate password reset SMS (if using SMS-based reset).
 * Format: [KETCHUP OFFICIAL] Reset code: 123456. Valid 10 mins. Never share PIN. Report fraud: 081-234-5678
 */
export function generatePasswordResetSMS(options: {
  resetCode: string;
  validityMinutes?: number;
}): string {
  const validity = options.validityMinutes || 10;
  const message = `Reset code: ${options.resetCode}. Valid ${validity} mins.`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generate OTP/2FA verification SMS.
 * Format: [KETCHUP OFFICIAL] Your OTP: 123456. Valid 5 mins. Never share PIN. Report fraud: 081-234-5678
 */
export function generateOTPSMS(options: {
  otp: string;
  validityMinutes?: number;
  purpose?: string; // e.g., "login", "transaction"
}): string {
  const validity = options.validityMinutes || 5;
  const purposeText = options.purpose ? ` for ${options.purpose}` : '';
  const message = `Your OTP${purposeText}: ${options.otp}. Valid ${validity} mins.`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generate voucher redemption confirmation SMS.
 * Format: [KETCHUP OFFICIAL] Voucher redeemed: N$250. Ref: ABC123. Thank you! Never share PIN. Report fraud: 081-234-5678
 */
export function generateRedemptionConfirmationSMS(options: {
  amount: string;
  reference: string;
}): string {
  const message = `Voucher redeemed: ${options.amount}. Ref: ${options.reference}. Thank you!`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generate account locked SMS (security alert).
 * Format: [KETCHUP OFFICIAL] Account locked due to suspicious activity. Call: 061-123-4567. Never share PIN. Report fraud: 081-234-5678
 */
export function generateAccountLockedSMS(options?: {
  contactNumber?: string;
}): string {
  const contact = options?.contactNumber || '061-123-4567';
  const message = `Account locked due to suspicious activity. Call: ${contact}.`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generate welcome SMS for new beneficiaries.
 * Format: [KETCHUP OFFICIAL] Welcome to Ketchup SmartPay! Check your email for details. Never share PIN. Report fraud: 081-234-5678
 */
export function generateWelcomeSMS(options?: {
  firstName?: string;
}): string {
  const greeting = options?.firstName ? `Welcome ${options.firstName}!` : 'Welcome to Ketchup SmartPay!';
  const message = `${greeting} Check your email for details.`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generate programme update SMS.
 * Format: [KETCHUP OFFICIAL] Programme update: [message]. Check email for full details. Never share PIN. Report fraud: 081-234-5678
 */
export function generateProgrammeUpdateSMS(options: {
  updateMessage: string;
}): string {
  // Keep update message very short to fit in SMS
  const shortMessage = options.updateMessage.substring(0, 40);
  const message = `Programme update: ${shortMessage}. Check email for details.`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generate agent float confirmation SMS.
 * Format: [KETCHUP OFFICIAL] Float added: N$10,000. New balance: N$25,000. Ref: FLT123. Never share PIN. Report fraud: 081-234-5678
 */
export function generateFloatConfirmationSMS(options: {
  addedAmount: string;
  newBalance: string;
  reference: string;
}): string {
  const message = `Float added: ${options.addedAmount}. New balance: ${options.newBalance}. Ref: ${options.reference}.`;
  return formatSMSWithAuthMarkers(message);
}

/**
 * Generic authenticated SMS (for custom messages).
 * Use this when you need to send a custom message with authentication markers.
 */
export function generateAuthenticatedSMS(message: string): string {
  return formatSMSWithAuthMarkers(message);
}
