/**
 * Fraud Alert Email Template – Notify users about suspicious activity.
 * Used by: Fraud detection system, security monitoring.
 * Location: src/lib/email-templates/fraud-alert.ts
 */

import { CONTACT_EMAIL } from '@/lib/contact';
import { getEmailFooterText, getEmailFooterHtml } from './components/footer';

export interface FraudAlertEmailOptions {
  recipientName: string;
  recipientEmail: string;
  alertType: 'suspicious_login' | 'unusual_activity' | 'multiple_failed_attempts' | 'voucher_fraud' | 'general';
  alertDescription: string;
  timestamp: string; // e.g., "March 18, 2026 at 3:45 PM"
  actionRequired?: string;
  affectedResource?: string; // e.g., "Voucher ABC-123" or "Account login"
}

/**
 * Generate fraud alert email subject.
 */
export function getFraudAlertSubject(options: FraudAlertEmailOptions): string {
  const typeLabels = {
    suspicious_login: 'Suspicious Login Detected',
    unusual_activity: 'Unusual Activity Detected',
    multiple_failed_attempts: 'Multiple Failed Login Attempts',
    voucher_fraud: 'Potential Voucher Fraud Detected',
    general: 'Security Alert',
  };
  
  return `🚨 SECURITY ALERT: ${typeLabels[options.alertType]}`;
}

/**
 * Generate fraud alert email plain text.
 */
export function getFraudAlertText(options: FraudAlertEmailOptions): string {
  const { recipientName, alertDescription, timestamp, actionRequired, affectedResource } = options;

  return `
⚠️ URGENT SECURITY ALERT ⚠️

Dear ${recipientName},

We detected suspicious activity on your Ketchup SmartPay account.

ALERT DETAILS:
─────────────────
Time: ${timestamp}
${affectedResource ? `Affected: ${affectedResource}` : ''}

WHAT HAPPENED:
${alertDescription}

${actionRequired ? `
IMMEDIATE ACTION REQUIRED:
${actionRequired}
` : `
RECOMMENDED ACTIONS:
1. Review your recent account activity
2. Change your password immediately if you suspect unauthorized access
3. Contact our fraud team: fraud@ketchup.cc
4. Call our 24/7 fraud hotline: +264 61 123 4567
`}

DID YOU AUTHORIZE THIS ACTIVITY?
• If YES: No action needed. You can safely ignore this alert.
• If NO: Contact us immediately at fraud@ketchup.cc or call +264 61 123 4567.

IMPORTANT: This is an automated security alert. We will NEVER ask you for:
• Your password or PIN
• Voucher codes
• OTP or verification codes

Stay safe,
Ketchup SmartPay Security Team

---

${getEmailFooterText({ securityNote: '⚠️ If you did NOT authorize this activity, contact fraud@ketchup.cc IMMEDIATELY.' })}
`.trim();
}

/**
 * Generate fraud alert email HTML.
 */
export function getFraudAlertHtml(options: FraudAlertEmailOptions): string {
  const { recipientName, alertDescription, timestamp, actionRequired, affectedResource } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
          <!-- URGENT Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 8px 8px 0 0;">
              <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <span style="font-size: 48px;">🚨</span>
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">SECURITY ALERT</h1>
              <p style="margin: 8px 0 0; color: #fecaca; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                Immediate Attention Required
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 16px; line-height: 1.5;">
                Dear <strong>${recipientName}</strong>,
              </p>
              
              <div style="padding: 20px; background-color: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; color: #991b1b; font-size: 15px; font-weight: 700;">
                  ⚠️ We detected suspicious activity on your Ketchup SmartPay account.
                </p>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                  Please review the details below and take immediate action if you did not authorize this activity.
                </p>
              </div>
              
              <!-- Alert Details -->
              <div style="background: #f8f9fa; border-left: 4px solid #dc2626; border-radius: 4px; padding: 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                  Alert Details
                </h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Time:</td>
                    <td style="padding: 6px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${timestamp}</td>
                  </tr>
                  ${affectedResource ? `
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Affected:</td>
                    <td style="padding: 6px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">${affectedResource}</td>
                  </tr>
                  ` : ''}
                </table>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                    <strong style="color: #1a1a1a;">What happened:</strong><br/>
                    ${alertDescription}
                  </p>
                </div>
              </div>
              
              <!-- Action Required -->
              ${actionRequired ? `
              <div style="padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #92400e; font-size: 15px; font-weight: 700;">
                  🔴 Immediate Action Required:
                </h3>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6; white-space: pre-line;">
                  ${actionRequired}
                </p>
              </div>
              ` : `
              <div style="padding: 20px; background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #075985; font-size: 15px; font-weight: 700;">
                  Recommended Actions:
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px; line-height: 1.8;">
                  <li>Review your recent account activity</li>
                  <li>Change your password immediately if you suspect unauthorized access</li>
                  <li>Contact our fraud team: <a href="mailto:fraud@ketchup.cc" style="color: #0284c7; text-decoration: none; font-weight: 600;">fraud@ketchup.cc</a></li>
                  <li>Call our 24/7 fraud hotline: <strong>+264 61 123 4567</strong></li>
                </ol>
              </div>
              `}
              
              <!-- Authorization Check -->
              <div style="padding: 20px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #1a1a1a; font-size: 15px; font-weight: 600;">
                  Did you authorize this activity?
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #22c55e; font-size: 14px; font-weight: 600;">✓ If YES:</td>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px; text-align: right;">No action needed</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600;">✗ If NO:</td>
                    <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 700; text-align: right;">Contact us immediately!</td>
                  </tr>
                </table>
              </div>
              
              <!-- Security Reminder -->
              <div style="padding: 16px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #991b1b; font-size: 13px; font-weight: 600;">
                  🔒 Important Security Reminder:
                </p>
                <p style="margin: 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">
                  This is an automated security alert. We will <strong>NEVER</strong> ask you for your password, PIN, voucher codes, or OTP codes via email or phone.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer Contact -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0 0 12px; color: #1a1a1a; font-size: 15px; font-weight: 600;">
                  Need Help? Contact Us 24/7
                </p>
                <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                  Email: <a href="mailto:fraud@ketchup.cc" style="color: #dc2626; text-decoration: none; font-weight: 600;">fraud@ketchup.cc</a>
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                  Phone: <strong>+264 61 123 4567</strong> (toll-free)
                </p>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Authentication Security Footer (SEC-008) -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px; margin-top: 0;">
          <tr>
            <td>
              ${getEmailFooterHtml({ securityNote: '⚠️ If you did NOT authorize this activity, contact fraud@ketchup.cc IMMEDIATELY.' })}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Generate complete fraud alert email (subject, text, html).
 */
export function generateFraudAlertEmail(options: FraudAlertEmailOptions) {
  return {
    subject: getFraudAlertSubject(options),
    text: getFraudAlertText(options),
    html: getFraudAlertHtml(options),
  };
}
