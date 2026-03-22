/**
 * Email Authentication Footer Component – Security markers for all emails.
 * Implements SEC-008: Email/SMS Authentication Markers.
 * Used by: All email templates to help users identify legitimate communications.
 * Location: src/lib/email-templates/components/footer.ts
 */

import { CONTACT_EMAIL } from '@/lib/contact';

export interface EmailFooterOptions {
  /** Additional security notes (optional) */
  securityNote?: string;
}

/**
 * Generate authentication footer for plain text emails.
 * Always include this footer in ALL transactional emails.
 */
export function getEmailFooterText(options?: EmailFooterOptions): string {
  return `
═══════════════════════════════════════════════

🔒 VERIFY THIS MESSAGE IS LEGITIMATE

✓ Sent from: ${CONTACT_EMAIL}
✓ Official Ketchup SmartPay Communication
✓ We NEVER ask for your PIN or password

${options?.securityNote || ''}

Suspicious message?
Report: fraud@ketchup.cc
Call: +264 61 123 4567 (toll-free)

───────────────────────────────────────────────

Ketchup SmartPay
Licensed by Bank of Namibia (E-Money Issuer)
`.trim();
}

/**
 * Generate authentication footer for HTML emails.
 * Always include this footer in ALL transactional emails.
 * Uses inline styles for maximum email client compatibility.
 */
export function getEmailFooterHtml(options?: EmailFooterOptions): string {
  return `
<!-- Authentication Security Footer (SEC-008) -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px; border-top: 3px solid #dc2626;">
  <tr>
    <td style="padding: 0;">
      <!-- Security Warning Box -->
      <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; color: #856404; font-size: 16px; font-weight: 600;">
          🔒 Verify This Message is Legitimate
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 4px 0;">
              <span style="color: #22c55e; font-size: 16px; margin-right: 8px;">✓</span>
              <span style="color: #333; font-size: 14px;">Sent from: <strong>${CONTACT_EMAIL}</strong></span>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">
              <span style="color: #22c55e; font-size: 16px; margin-right: 8px;">✓</span>
              <span style="color: #333; font-size: 14px;">Official Ketchup SmartPay Communication</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">
              <span style="color: #22c55e; font-size: 16px; margin-right: 8px;">✓</span>
              <span style="color: #333; font-size: 14px;">We <strong>NEVER</strong> ask for your PIN or password</span>
            </td>
          </tr>
          ${options?.securityNote ? `
          <tr>
            <td style="padding: 12px 0 4px 0;">
              <span style="color: #dc2626; font-size: 14px; font-weight: 600;">${options.securityNote}</span>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Fraud Reporting -->
      <div style="text-align: center; padding: 20px 0; background: #f8f9fa;">
        <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
          Suspicious message?
        </p>
        <p style="margin: 0 0 8px 0; color: #4a4a4a; font-size: 14px;">
          Report: <a href="mailto:fraud@ketchup.cc" style="color: #dc2626; text-decoration: none; font-weight: 600;">fraud@ketchup.cc</a>
        </p>
        <p style="margin: 0; color: #4a4a4a; font-size: 14px;">
          Call: <strong>+264 61 123 4567</strong> (toll-free)
        </p>
      </div>
      
      <!-- Company Footer -->
      <div style="text-align: center; padding: 30px 20px 20px; background: #f8f9fa; border-top: 1px solid #e5e7eb;">
        <div style="margin-bottom: 12px;">
          <!-- Ketchup Logo (emoji fallback) -->
          <div style="background-color: #ffffff; border-radius: 12px; padding: 12px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <span style="font-size: 32px;">🍅</span>
          </div>
        </div>
        <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">
          Ketchup SmartPay
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
          Licensed by Bank of Namibia (E-Money Issuer)
        </p>
      </div>
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Complete email footer for convenience (both text and HTML).
 * Use this when generating full email templates.
 */
export function generateEmailFooter(options?: EmailFooterOptions) {
  return {
    text: getEmailFooterText(options),
    html: getEmailFooterHtml(options),
  };
}
