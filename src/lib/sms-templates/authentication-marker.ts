/**
 * SMS Authentication Markers – Security prefixes/suffixes for all SMS messages.
 * Implements SEC-008: SMS Authentication Markers to prevent phishing.
 * Location: src/lib/sms-templates/authentication-marker.ts
 */

/** Official Ketchup SMS prefix (20 characters) */
export const SMS_AUTH_PREFIX = '[KETCHUP OFFICIAL] ';

/** Security warning suffix (45 characters) */
export const SMS_AUTH_SUFFIX = ' Never share PIN. Report fraud: 081-234-5678';

/** Maximum SMS length for GSM-7 encoding (single SMS) */
export const SMS_MAX_LENGTH = 160;

/** Available space for message content after auth markers */
export const SMS_CONTENT_MAX_LENGTH = SMS_MAX_LENGTH - SMS_AUTH_PREFIX.length - SMS_AUTH_SUFFIX.length;

/**
 * Format SMS message with authentication markers.
 * Automatically truncates message if too long to fit within 160 characters.
 * 
 * @param message - The core message content (without prefix/suffix)
 * @returns Formatted SMS with authentication markers
 */
export function formatSMSWithAuthMarkers(message: string): string {
  // Truncate message if too long
  let content = message.trim();
  if (content.length > SMS_CONTENT_MAX_LENGTH) {
    // Leave space for "..." truncation indicator
    content = content.substring(0, SMS_CONTENT_MAX_LENGTH - 3) + '...';
  }
  
  return `${SMS_AUTH_PREFIX}${content}${SMS_AUTH_SUFFIX}`;
}

/**
 * Calculate if a message will fit in a single SMS (160 chars).
 * Use this before sending to check if message needs to be shortened.
 * 
 * @param message - The core message content (without auth markers)
 * @returns true if message will fit in single SMS with auth markers
 */
export function willFitInSingleSMS(message: string): boolean {
  const totalLength = SMS_AUTH_PREFIX.length + message.trim().length + SMS_AUTH_SUFFIX.length;
  return totalLength <= SMS_MAX_LENGTH;
}

/**
 * Get remaining character count for message content.
 * Useful for displaying character counters in UI.
 * 
 * @param currentMessage - Current message being composed
 * @returns Remaining characters available for content
 */
export function getRemainingChars(currentMessage: string): number {
  return SMS_CONTENT_MAX_LENGTH - currentMessage.trim().length;
}

/**
 * Validate SMS message length and return helpful error if too long.
 * 
 * @param message - Message to validate
 * @returns { valid: true } or { valid: false, error: string, maxLength: number }
 */
export function validateSMSLength(message: string): 
  | { valid: true }
  | { valid: false; error: string; maxLength: number } {
  
  const contentLength = message.trim().length;
  
  if (contentLength === 0) {
    return {
      valid: false,
      error: 'Message cannot be empty',
      maxLength: SMS_CONTENT_MAX_LENGTH,
    };
  }
  
  if (contentLength > SMS_CONTENT_MAX_LENGTH) {
    return {
      valid: false,
      error: `Message too long. Maximum ${SMS_CONTENT_MAX_LENGTH} characters (currently ${contentLength})`,
      maxLength: SMS_CONTENT_MAX_LENGTH,
    };
  }
  
  return { valid: true };
}
