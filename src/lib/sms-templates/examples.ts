/**
 * SMS Template Examples – Demonstrates usage of all SMS templates.
 * Use this file for testing and as a reference for implementation.
 * Location: src/lib/sms-templates/examples.ts
 * 
 * Run with: tsx src/lib/sms-templates/examples.ts
 * Or import in your tests.
 */

import {
  generateVoucherIssuanceSMS,
  generateFraudAlertSMS,
  generatePasswordResetSMS,
  generateOTPSMS,
  generateRedemptionConfirmationSMS,
  generateAccountLockedSMS,
  generateWelcomeSMS,
  generateProgrammeUpdateSMS,
  generateFloatConfirmationSMS,
  generateAuthenticatedSMS,
} from './templates';

import { willFitInSingleSMS, getRemainingChars } from './authentication-marker';

interface SmsExample {
  scenario: string;
  to: string;
  message: string;
  length: number;
  fitsInSingleSMS: boolean;
  remainingChars: number;
}

/**
 * Example 1: Voucher Issuance SMS
 */
export function exampleVoucherIssuance(): SmsExample {
  const message = generateVoucherIssuanceSMS({
    amount: 'N$250',
    voucherCode: 'KTC-MAR-123',
    expiryDate: 'Mar 25',
  });

  return {
    scenario: 'Voucher Issuance',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 2: Fraud Alert SMS
 */
export function exampleFraudAlert(): SmsExample {
  const message = generateFraudAlertSMS({
    alertType: 'suspicious_login',
    contactNumber: '061-123-4567',
  });

  return {
    scenario: 'Fraud Alert - Suspicious Login',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 3: Password Reset SMS
 */
export function examplePasswordReset(): SmsExample {
  const message = generatePasswordResetSMS({
    resetCode: '789456',
    validityMinutes: 10,
  });

  return {
    scenario: 'Password Reset Code',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 4: OTP/2FA SMS
 */
export function exampleOTP(): SmsExample {
  const message = generateOTPSMS({
    otp: '123456',
    validityMinutes: 5,
    purpose: 'login',
  });

  return {
    scenario: 'OTP for Login',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 5: Voucher Redemption Confirmation
 */
export function exampleRedemptionConfirmation(): SmsExample {
  const message = generateRedemptionConfirmationSMS({
    amount: 'N$250',
    reference: 'RED-2026-0318',
  });

  return {
    scenario: 'Voucher Redeemed',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 6: Account Locked Alert
 */
export function exampleAccountLocked(): SmsExample {
  const message = generateAccountLockedSMS({
    contactNumber: '061-123-4567',
  });

  return {
    scenario: 'Account Locked',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 7: Welcome SMS
 */
export function exampleWelcome(): SmsExample {
  const message = generateWelcomeSMS({
    firstName: 'Sarah',
  });

  return {
    scenario: 'Welcome New User',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 8: Programme Update
 */
export function exampleProgrammeUpdate(): SmsExample {
  const message = generateProgrammeUpdateSMS({
    updateMessage: 'Basic Income Grant payment dates changed to 5th-10th of each month',
  });

  return {
    scenario: 'Programme Update',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 9: Agent Float Confirmation
 */
export function exampleFloatConfirmation(): SmsExample {
  const message = generateFloatConfirmationSMS({
    addedAmount: 'N$10,000',
    newBalance: 'N$25,000',
    reference: 'FLT-2026-0318',
  });

  return {
    scenario: 'Float Added (Agent)',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 10: Custom Authenticated SMS
 */
export function exampleCustomMessage(): SmsExample {
  const customMessage = 'System maintenance scheduled for Mar 20, 10 PM-12 AM. Services will be unavailable.';
  const message = generateAuthenticatedSMS(customMessage);

  return {
    scenario: 'Custom Message - Maintenance Notice',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: willFitInSingleSMS(message),
    remainingChars: getRemainingChars(message),
  };
}

/**
 * Example 11: Message Too Long (Demonstrates Truncation)
 */
export function exampleLongMessage(): SmsExample {
  const longMessage = 'Your Basic Income Grant voucher for the month of March 2026 has been successfully issued and is now available for redemption at any authorized Ketchup SmartPay agent location throughout Namibia. Please ensure you bring valid identification.';
  const message = generateAuthenticatedSMS(longMessage);

  return {
    scenario: 'Long Message (Truncated)',
    to: '+264811234567',
    message,
    length: message.length,
    fitsInSingleSMS: message.length <= 160,
    remainingChars: 160 - message.length,
  };
}

/**
 * Generate all examples for testing
 */
export function generateAllExamples() {
  return {
    voucherIssuance: exampleVoucherIssuance(),
    fraudAlert: exampleFraudAlert(),
    passwordReset: examplePasswordReset(),
    otp: exampleOTP(),
    redemptionConfirmation: exampleRedemptionConfirmation(),
    accountLocked: exampleAccountLocked(),
    welcome: exampleWelcome(),
    programmeUpdate: exampleProgrammeUpdate(),
    floatConfirmation: exampleFloatConfirmation(),
    customMessage: exampleCustomMessage(),
    longMessage: exampleLongMessage(),
  };
}

/**
 * Validate all examples fit SMS constraints
 */
export function validateAllExamples() {
  const examples = generateAllExamples();
  const results = {
    total: 0,
    valid: 0,
    invalid: 0,
    warnings: [] as string[],
  };

  Object.entries(examples).forEach(([key, example]) => {
    results.total++;
    
    if (example.length > 160) {
      results.invalid++;
      results.warnings.push(`${example.scenario}: Exceeds 160 chars (${example.length} chars)`);
    } else {
      results.valid++;
    }
  });

  return results;
}

// If running as script, log examples to console
if (require.main === module) {
  console.log('='.repeat(80));
  console.log('SMS TEMPLATE EXAMPLES (SEC-008)');
  console.log('='.repeat(80));
  console.log('');

  const examples = generateAllExamples();

  Object.entries(examples).forEach(([key, example]) => {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Scenario: ${example.scenario}`);
    console.log(`To: ${example.to}`);
    console.log(`Length: ${example.length} / 160 chars`);
    console.log(`Fits in Single SMS: ${example.fitsInSingleSMS ? '✓' : '✗'}`);
    console.log(`${'─'.repeat(80)}`);
    console.log(example.message);
  });

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));

  const validation = validateAllExamples();
  console.log(`Total Examples: ${validation.total}`);
  console.log(`Valid (≤160 chars): ${validation.valid}`);
  console.log(`Invalid (>160 chars): ${validation.invalid}`);
  
  if (validation.warnings.length > 0) {
    console.log('\nWarnings:');
    validation.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
  }

  console.log('\n' + '='.repeat(80));
  console.log('KEY FEATURES:');
  console.log('  • Prefix: [KETCHUP OFFICIAL] (20 chars)');
  console.log('  • Suffix: Never share PIN. Report fraud: 081-234-5678 (45 chars)');
  console.log('  • Available for content: 95 chars');
  console.log('  • All messages include authentication markers automatically');
  console.log('='.repeat(80));
}
