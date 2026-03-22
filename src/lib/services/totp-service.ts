/**
 * TOTP Service – Two-Factor Authentication with Time-Based OTP
 * Location: src/lib/services/totp-service.ts
 * 
 * Purpose: Generate, verify, and manage TOTP secrets and backup codes for 2FA
 * Required by: SEC-005 - Two-Factor Authentication implementation
 * 
 * Security Features:
 * - TOTP secrets: Base32-encoded, stored encrypted in database
 * - Backup codes: Bcrypt-hashed, single-use, generated in sets of 10
 * - QR codes: Generated as data URLs for easy authenticator app setup
 * - Verification: 30-second time window with 1-step drift tolerance
 * 
 * Dependencies:
 * - speakeasy: TOTP generation and verification (RFC 6238)
 * - qrcode: QR code generation for authenticator apps
 * - bcryptjs: Backup code hashing
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Application name shown in authenticator apps
 * Format: "Ketchup Portals (user@example.com)"
 */
const APP_NAME = 'Ketchup Portals';

/**
 * TOTP configuration constants
 */
const TOTP_CONFIG = {
  encoding: 'base32' as const,
  algorithm: 'sha1' as const,
  digits: 6,
  step: 30, // 30-second time window
  window: 1, // Allow 1 step before/after for clock drift
};

/**
 * Backup code configuration
 */
const BACKUP_CODE_CONFIG = {
  count: 10, // Generate 10 backup codes
  length: 8, // 8 characters per code
  format: /^[A-Z0-9]{8}$/, // Uppercase alphanumeric
  bcryptRounds: 12, // Bcrypt work factor
};

/**
 * Generate a new TOTP secret (base32-encoded)
 * 
 * @returns Object with ascii and base32 secret
 * 
 * @example
 * const secret = generateTOTPSecret();
 * console.log(secret.base32); // "JBSWY3DPEHPK3PXP"
 * // Store secret.base32 in database (encrypted)
 */
export function generateTOTPSecret(): { ascii: string; base32: string } {
  const secret = speakeasy.generateSecret({
    name: APP_NAME,
    length: 32, // 32 bytes = 256 bits of entropy
  });

  if (!secret.ascii || !secret.base32) {
    throw new Error('Failed to generate TOTP secret');
  }

  return {
    ascii: secret.ascii,
    base32: secret.base32,
  };
}

/**
 * Generate a QR code data URL for authenticator app setup
 * 
 * @param secret - Base32-encoded TOTP secret
 * @param email - User's email (shown in authenticator app)
 * @returns Promise<string> - Data URL (data:image/png;base64,...)
 * 
 * @example
 * const secret = generateTOTPSecret();
 * const qrCodeDataURL = await generateQRCodeDataURL(secret.base32, 'user@example.com');
 * // Render in HTML: <img src={qrCodeDataURL} alt="2FA QR Code" />
 */
export async function generateQRCodeDataURL(
  secret: string,
  email: string
): Promise<string> {
  // Generate otpauth URL for authenticator apps
  // Format: otpauth://totp/Ketchup%20Portals:user@example.com?secret=SECRET&issuer=Ketchup%20Portals
  const otpauthUrl = speakeasy.otpauthURL({
    secret,
    encoding: TOTP_CONFIG.encoding,
    label: email,
    issuer: APP_NAME,
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.step,
  });

  try {
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'H', // High error correction
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('[TOTP] QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP token against a secret
 * 
 * @param secret - Base32-encoded TOTP secret
 * @param token - 6-digit TOTP code from user
 * @returns boolean - True if token is valid
 * 
 * @example
 * const isValid = verifyTOTPToken(user.totpSecret, '123456');
 * if (!isValid) {
 *   return Response.json({ errors: [{ code: 'InvalidToken', message: 'Invalid 2FA code' }] }, { status: 401 });
 * }
 */
export function verifyTOTPToken(secret: string, token: string): boolean {
  if (!secret || !token) {
    return false;
  }

  // Remove spaces and validate format
  const cleanToken = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  try {
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: TOTP_CONFIG.encoding,
      token: cleanToken,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      step: TOTP_CONFIG.step,
      window: TOTP_CONFIG.window, // Allow 1 step before/after for clock drift
    });

    return isValid;
  } catch (error) {
    console.error('[TOTP] Token verification failed:', error);
    return false;
  }
}

/**
 * Generate a set of backup codes for 2FA recovery
 * 
 * @returns Array of plain-text backup codes (user should save these securely)
 * 
 * @example
 * const backupCodes = generateBackupCodes();
 * console.log(backupCodes); // ["A1B2C3D4", "E5F6G7H8", ...]
 * // Hash these before storing in database
 * const hashedCodes = await Promise.all(backupCodes.map(hashBackupCode));
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < BACKUP_CODE_CONFIG.count; i++) {
    let code = '';
    const randomBytes = crypto.randomBytes(BACKUP_CODE_CONFIG.length);

    for (let j = 0; j < BACKUP_CODE_CONFIG.length; j++) {
      const randomIndex = randomBytes[j] % charset.length;
      code += charset[randomIndex];
    }

    codes.push(code);
  }

  return codes;
}

/**
 * Hash a backup code using bcrypt (for secure storage)
 * 
 * @param code - Plain-text backup code
 * @returns Promise<string> - Bcrypt hash
 * 
 * @example
 * const plainCode = 'A1B2C3D4';
 * const hashedCode = await hashBackupCode(plainCode);
 * // Store hashedCode in database (backup_codes array)
 */
export async function hashBackupCode(code: string): Promise<string> {
  if (!code || !BACKUP_CODE_CONFIG.format.test(code)) {
    throw new Error('Invalid backup code format');
  }

  try {
    const hash = await bcrypt.hash(code, BACKUP_CODE_CONFIG.bcryptRounds);
    return hash;
  } catch (error) {
    console.error('[TOTP] Backup code hashing failed:', error);
    throw new Error('Failed to hash backup code');
  }
}

/**
 * Verify a backup code against an array of hashed codes
 * Returns the hash that matched (so it can be removed from the array)
 * 
 * @param code - Plain-text backup code from user
 * @param hashedCodes - Array of bcrypt-hashed backup codes from database
 * @returns Promise<string | null> - Matched hash (to remove), or null if no match
 * 
 * @example
 * const matchedHash = await verifyBackupCode(userInput, user.backupCodes);
 * if (matchedHash) {
 *   // Remove used code from database
 *   const remainingCodes = user.backupCodes.filter(h => h !== matchedHash);
 *   await db.update(portalUsers)
 *     .set({ backupCodes: remainingCodes })
 *     .where(eq(portalUsers.id, userId));
 * } else {
 *   return Response.json({ errors: [{ code: 'InvalidCode' }] }, { status: 401 });
 * }
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<string | null> {
  if (!code || !BACKUP_CODE_CONFIG.format.test(code.toUpperCase())) {
    return null;
  }

  const cleanCode = code.toUpperCase().replace(/\s/g, '');

  if (!hashedCodes || hashedCodes.length === 0) {
    return null;
  }

  try {
    // Check each hashed code (bcrypt.compare is async)
    for (const hashedCode of hashedCodes) {
      const isMatch = await bcrypt.compare(cleanCode, hashedCode);
      if (isMatch) {
        return hashedCode; // Return the matched hash to remove it
      }
    }

    return null; // No match found
  } catch (error) {
    console.error('[TOTP] Backup code verification failed:', error);
    return null;
  }
}

/**
 * Format backup codes for display to user
 * Groups codes for readability: XXXX-XXXX format
 * 
 * @param codes - Array of plain-text backup codes
 * @returns Array of formatted codes
 * 
 * @example
 * const codes = generateBackupCodes();
 * const formatted = formatBackupCodesForDisplay(codes);
 * console.log(formatted); // ["A1B2-C3D4", "E5F6-G7H8", ...]
 */
export function formatBackupCodesForDisplay(codes: string[]): string[] {
  return codes.map((code) => {
    if (code.length === 8) {
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    return code;
  });
}

/**
 * Validate TOTP secret format (base32)
 * 
 * @param secret - Base32-encoded secret to validate
 * @returns boolean - True if valid base32 format
 */
export function isValidTOTPSecret(secret: string): boolean {
  if (!secret || typeof secret !== 'string') {
    return false;
  }

  // Base32 alphabet: A-Z and 2-7
  const base32Regex = /^[A-Z2-7]+=*$/;
  return base32Regex.test(secret) && secret.length >= 16;
}

/**
 * Generate TOTP setup payload (for /auth/2fa/setup endpoint)
 * Returns everything needed for 2FA setup flow
 * 
 * @param email - User's email
 * @returns Promise with secret, QR code, and backup codes
 * 
 * @example
 * const setup = await generateTOTPSetup('user@example.com');
 * // Return to frontend:
 * return Response.json({
 *   secret: setup.secret,
 *   qrCodeDataURL: setup.qrCodeDataURL,
 *   backupCodes: setup.backupCodes, // Plain text (user must save)
 * });
 * // Store in database after verification:
 * await db.update(portalUsers).set({
 *   totpSecret: setup.secret,
 *   backupCodes: setup.hashedBackupCodes,
 * });
 */
export async function generateTOTPSetup(email: string): Promise<{
  secret: string;
  qrCodeDataURL: string;
  backupCodes: string[];
  hashedBackupCodes: string[];
}> {
  // Generate TOTP secret
  const { base32: secret } = generateTOTPSecret();

  // Generate QR code
  const qrCodeDataURL = await generateQRCodeDataURL(secret, email);

  // Generate backup codes
  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = await Promise.all(
    backupCodes.map((code) => hashBackupCode(code))
  );

  return {
    secret,
    qrCodeDataURL,
    backupCodes, // Plain text (show to user ONCE)
    hashedBackupCodes, // Store in database
  };
}
