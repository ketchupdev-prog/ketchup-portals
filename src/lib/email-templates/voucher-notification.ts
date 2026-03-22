/**
 * Voucher Notification Email Template – Notify beneficiaries about issued vouchers.
 * Used by: /api/v1/vouchers/issue or voucher batch issuance.
 * Location: src/lib/email-templates/voucher-notification.ts
 */

import { CONTACT_EMAIL } from '@/lib/contact';
import { getEmailFooterText, getEmailFooterHtml } from './components/footer';

export interface VoucherNotificationEmailOptions {
  recipientName: string;
  recipientEmail: string;
  voucherCode: string;
  voucherAmount: string; // e.g., "N$250.00"
  expiryDate: string; // e.g., "March 25, 2026"
  programmeName?: string;
  redemptionInstructions?: string;
}

/**
 * Generate voucher notification email subject.
 */
export function getVoucherNotificationSubject(options: VoucherNotificationEmailOptions): string {
  return `Your Ketchup voucher (${options.voucherAmount}) has been issued`;
}

/**
 * Generate voucher notification email plain text.
 */
export function getVoucherNotificationText(options: VoucherNotificationEmailOptions): string {
  const { recipientName, voucherCode, voucherAmount, expiryDate, programmeName, redemptionInstructions } = options;

  return `
Dear ${recipientName},

A new voucher has been issued to you!

VOUCHER DETAILS:
─────────────────
Code: ${voucherCode}
Amount: ${voucherAmount}
Valid Until: ${expiryDate}
${programmeName ? `Programme: ${programmeName}` : ''}

HOW TO REDEEM:
${redemptionInstructions || `
1. Visit any authorized Ketchup agent
2. Provide your voucher code: ${voucherCode}
3. Present your valid ID
4. Receive your funds
`}

IMPORTANT SECURITY REMINDERS:
• Keep your voucher code secure
• Never share your code via SMS or email
• Only redeem at authorized Ketchup agents
• Report suspicious activity immediately

Questions? Contact support at ${CONTACT_EMAIL}

---

${getEmailFooterText({ securityNote: '⚠️ NEVER share your voucher code via SMS or email to anyone.' })}
`.trim();
}

/**
 * Generate voucher notification email HTML.
 */
export function getVoucherNotificationHtml(options: VoucherNotificationEmailOptions): string {
  const { recipientName, voucherCode, voucherAmount, expiryDate, programmeName, redemptionInstructions } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voucher Issued</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px 8px 0 0;">
              <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <span style="font-size: 48px;">🎫</span>
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 600;">Voucher Issued!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 16px; line-height: 1.5;">
                Dear <strong>${recipientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                A new voucher has been issued to you through Ketchup SmartPay.
              </p>
              
              <!-- Voucher Details Card -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #166534; font-size: 18px; font-weight: 600;">
                  Voucher Details
                </h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">Code:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 16px; font-weight: 700; text-align: right; font-family: 'Courier New', monospace;">${voucherCode}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">Amount:</td>
                    <td style="padding: 8px 0; color: #16a34a; font-size: 20px; font-weight: 700; text-align: right;">${voucherAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">Valid Until:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${expiryDate}</td>
                  </tr>
                  ${programmeName ? `
                  <tr>
                    <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">Programme:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${programmeName}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <!-- Redemption Instructions -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                  How to Redeem:
                </h3>
                ${redemptionInstructions ? `
                  <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; white-space: pre-line;">${redemptionInstructions}</p>
                ` : `
                  <ol style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                    <li>Visit any authorized Ketchup agent</li>
                    <li>Provide your voucher code: <strong style="font-family: 'Courier New', monospace;">${voucherCode}</strong></li>
                    <li>Present your valid ID</li>
                    <li>Receive your funds</li>
                  </ol>
                `}
              </div>
              
              <!-- Security Warning -->
              <div style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">
                  🔐 Important Security Reminders:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <li>Keep your voucher code secure</li>
                  <li>Never share your code via SMS or email</li>
                  <li>Only redeem at authorized Ketchup agents</li>
                  <li>Report suspicious activity immediately</li>
                </ul>
              </div>
              
              <!-- Support Contact -->
              <p style="margin: 0; color: #6a6a6a; font-size: 14px; line-height: 1.5; text-align: center;">
                Questions? Contact us at <a href="mailto:${CONTACT_EMAIL}" style="color: #22c55e; text-decoration: none; font-weight: 600;">${CONTACT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Authentication Security Footer (SEC-008) -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px; margin-top: 0;">
          <tr>
            <td>
              ${getEmailFooterHtml({ securityNote: '⚠️ NEVER share your voucher code via SMS or email to anyone.' })}
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
 * Generate complete voucher notification email (subject, text, html).
 */
export function generateVoucherNotificationEmail(options: VoucherNotificationEmailOptions) {
  return {
    subject: getVoucherNotificationSubject(options),
    text: getVoucherNotificationText(options),
    html: getVoucherNotificationHtml(options),
  };
}
