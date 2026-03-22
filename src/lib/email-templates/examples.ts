/**
 * Email Template Examples – Demonstrates usage of all email templates.
 * Use this file for testing and as a reference for implementation.
 * Location: src/lib/email-templates/examples.ts
 * 
 * Run with: tsx src/lib/email-templates/examples.ts
 * Or import in your tests.
 */

import { generatePasswordResetEmail } from './password-reset';
import { generateVoucherNotificationEmail } from './voucher-notification';
import { generateFraudAlertEmail } from './fraud-alert';
import { generateWelcomeEmail } from './welcome';
import { generatePhishingAwarenessEmail } from './education/phishing-awareness';

/**
 * Example 1: Password Reset Email
 */
export function examplePasswordReset() {
  const email = generatePasswordResetEmail({
    resetLink: 'https://portal.ketchup.cc/ketchup/forgot-password?token=abc123def456',
    portal: 'ketchup',
    recipientEmail: 'john.doe@example.com',
  });

  return {
    scenario: 'Password Reset',
    to: 'john.doe@example.com',
    ...email,
  };
}

/**
 * Example 2: Voucher Notification Email
 */
export function exampleVoucherNotification() {
  const email = generateVoucherNotificationEmail({
    recipientName: 'Sarah Nangolo',
    recipientEmail: 'sarah.nangolo@example.com',
    voucherCode: 'KTC-2026-MAR-12345',
    voucherAmount: 'N$250.00',
    expiryDate: 'March 25, 2026',
    programmeName: 'Basic Income Grant - March 2026',
    redemptionInstructions: `Visit any authorized Ketchup agent:
• Show this voucher code: KTC-2026-MAR-12345
• Present your Namibian ID
• Receive your cash benefit

Authorized agents include major retailers, spaza shops, and mobile agents.`,
  });

  return {
    scenario: 'Voucher Issuance',
    to: 'sarah.nangolo@example.com',
    ...email,
  };
}

/**
 * Example 3: Fraud Alert Email
 */
export function exampleFraudAlert() {
  const email = generateFraudAlertEmail({
    recipientName: 'Michael Shikongo',
    recipientEmail: 'michael.shikongo@example.com',
    alertType: 'suspicious_login',
    alertDescription: 'We detected a login attempt from an unrecognized device in Windhoek, Namibia. The attempt was made using a mobile browser (Chrome on Android) at 3:45 PM today.',
    timestamp: 'March 18, 2026 at 3:45 PM',
    affectedResource: 'Government Portal Account',
    actionRequired: `If this was not you, take immediate action:
1. Change your password immediately at: portal.ketchup.cc/government/settings/security
2. Review your recent account activity
3. Contact our fraud team at fraud@ketchup.cc
4. Call our 24/7 fraud hotline: +264 61 123 4567`,
  });

  return {
    scenario: 'Fraud Alert - Suspicious Login',
    to: 'michael.shikongo@example.com',
    ...email,
  };
}

/**
 * Example 4: Welcome Email for New Beneficiary
 */
export function exampleWelcomeBeneficiary() {
  const email = generateWelcomeEmail({
    recipientName: 'Anna Nghipandulwa',
    recipientEmail: 'anna.nghipandulwa@example.com',
    portal: 'ketchup',
    loginUrl: 'https://portal.ketchup.cc/ketchup/login',
    accountType: 'beneficiary',
    programmeDetails: `You have been enrolled in the Basic Income Grant programme for March 2026.

Monthly Benefit: N$250
Payment Schedule: Between 1st-5th of each month
Programme Duration: 12 months (renewable)

You will receive notifications via SMS and email when your monthly voucher is ready for redemption.`,
  });

  return {
    scenario: 'Welcome - New Beneficiary',
    to: 'anna.nghipandulwa@example.com',
    ...email,
  };
}

/**
 * Example 5: Welcome Email for Portal User
 */
export function exampleWelcomePortalUser() {
  const email = generateWelcomeEmail({
    recipientName: 'David Angula',
    recipientEmail: 'david.angula@government.na',
    portal: 'government',
    loginUrl: 'https://portal.ketchup.cc/government/login',
    accountType: 'portal_user',
  });

  return {
    scenario: 'Welcome - Government Portal User',
    to: 'david.angula@government.na',
    ...email,
  };
}

/**
 * Example 6: Phishing Awareness Education
 */
export function examplePhishingAwareness() {
  const email = generatePhishingAwarenessEmail({
    recipientName: 'All Ketchup Users',
    recipientEmail: 'users@ketchup.cc',
  });

  return {
    scenario: 'Security Education - Phishing Awareness',
    to: 'all-users@ketchup.cc',
    ...email,
  };
}

/**
 * Example 7: Voucher Fraud Alert
 */
export function exampleVoucherFraudAlert() {
  const email = generateFraudAlertEmail({
    recipientName: 'Elizabeth Haufiku',
    recipientEmail: 'elizabeth.haufiku@example.com',
    alertType: 'voucher_fraud',
    alertDescription: 'We detected multiple attempts to redeem your voucher (Code: KTC-2026-MAR-67890) from different locations within a short time period. This pattern is consistent with voucher code theft.',
    timestamp: 'March 18, 2026 at 2:15 PM',
    affectedResource: 'Voucher KTC-2026-MAR-67890',
    actionRequired: `Immediate action required to protect your voucher:
1. If you have NOT attempted to redeem this voucher, call us immediately
2. Do NOT share your voucher code with anyone
3. Report this incident: fraud@ketchup.cc or +264 61 123 4567
4. We have temporarily frozen this voucher pending investigation`,
  });

  return {
    scenario: 'Fraud Alert - Voucher Theft',
    to: 'elizabeth.haufiku@example.com',
    ...email,
  };
}

/**
 * Generate all examples for testing
 */
export function generateAllExamples() {
  return {
    passwordReset: examplePasswordReset(),
    voucherNotification: exampleVoucherNotification(),
    fraudAlert: exampleFraudAlert(),
    welcomeBeneficiary: exampleWelcomeBeneficiary(),
    welcomePortalUser: exampleWelcomePortalUser(),
    phishingAwareness: examplePhishingAwareness(),
    voucherFraudAlert: exampleVoucherFraudAlert(),
  };
}

// If running as script, log examples to console
if (require.main === module) {
  console.log('='.repeat(80));
  console.log('EMAIL TEMPLATE EXAMPLES (SEC-008)');
  console.log('='.repeat(80));
  console.log('');

  const examples = generateAllExamples();

  Object.entries(examples).forEach(([key, example]) => {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Scenario: ${example.scenario}`);
    console.log(`To: ${example.to}`);
    console.log(`Subject: ${example.subject}`);
    console.log(`${'─'.repeat(80)}`);
    console.log('\nPLAIN TEXT VERSION:');
    console.log(example.text.substring(0, 500) + '...\n');
    console.log('\nHTML VERSION (truncated):');
    console.log(example.html.substring(0, 500) + '...\n');
  });

  console.log('\n' + '='.repeat(80));
  console.log('Total examples generated:', Object.keys(examples).length);
  console.log('='.repeat(80));
}
