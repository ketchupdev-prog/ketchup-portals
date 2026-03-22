/**
 * Phishing Awareness Email Template – Educate users about identifying legitimate communications.
 * Used by: Security awareness campaigns, new user onboarding.
 * Location: src/lib/email-templates/education/phishing-awareness.ts
 */

import { CONTACT_EMAIL } from '@/lib/contact';
import { getEmailFooterHtml, getEmailFooterText } from '../components/footer';

export interface PhishingAwarenessEmailOptions {
  recipientName: string;
  recipientEmail: string;
}

/**
 * Generate phishing awareness email subject.
 */
export function getPhishingAwarenessSubject(): string {
  return '🔒 How to Identify Official Ketchup Messages';
}

/**
 * Generate phishing awareness email plain text.
 */
export function getPhishingAwarenessText(options: PhishingAwarenessEmailOptions): string {
  const { recipientName } = options;

  return `
🔒 STAY SAFE: IDENTIFY LEGITIMATE KETCHUP MESSAGES

Dear ${recipientName},

Your security is our priority! Learn how to identify legitimate Ketchup SmartPay communications and protect yourself from phishing attacks.

═══════════════════════════════════════════════

✓ LEGITIMATE KETCHUP EMAILS:

• Always sent from: ${CONTACT_EMAIL}
• Include Ketchup logo and official footer
• NEVER ask for your PIN or full password
• NEVER include links to external websites
• Include security verification markers

═══════════════════════════════════════════════

✓ LEGITIMATE KETCHUP SMS:

• Always start with: [KETCHUP OFFICIAL]
• Always end with fraud reporting number
• NEVER ask for your PIN
• Keep messages concise (under 160 characters)

═══════════════════════════════════════════════

⚠️ WARNING SIGNS OF PHISHING:

❌ Email from strange address (not @ketchup.cc)
❌ Asks for your PIN, password, or OTP code
❌ Urgent language ("Your account will be closed!")
❌ Links to unfamiliar websites
❌ Poor spelling or grammar
❌ Unexpected attachments
❌ Requests for sensitive information via reply

═══════════════════════════════════════════════

🛡️ IF YOU SUSPECT PHISHING:

1. DO NOT click any links
2. DO NOT reply with personal information
3. DO NOT download attachments
4. Forward suspicious emails to: fraud@ketchup.cc
5. Delete suspicious SMS immediately
6. Call our fraud hotline: +264 61 123 4567 (toll-free)

═══════════════════════════════════════════════

REAL EXAMPLES:

✓ LEGITIMATE EMAIL:
From: ${CONTACT_EMAIL}
Subject: Your Ketchup voucher (N$250) has been issued
Footer: Includes verification markers and fraud reporting info

❌ PHISHING EMAIL:
From: ketchup-support@gmail.com
Subject: URGENT: Verify your account now!
Footer: Missing or generic

✓ LEGITIMATE SMS:
[KETCHUP OFFICIAL] Voucher N$250 issued. Code: ABC-123. Never share PIN. Report fraud: 081-234-5678

❌ PHISHING SMS:
Ketchup: Click here to claim your voucher: bit.ly/xyz123

═══════════════════════════════════════════════

REMEMBER:
• We will NEVER ask for your PIN or password
• We will NEVER threaten to close your account
• We will NEVER send you unsolicited links
• We will NEVER ask you to urgently transfer funds

Stay vigilant and stay safe!

Ketchup SmartPay Security Team

---

${getEmailFooterText()}
`.trim();
}

/**
 * Generate phishing awareness email HTML.
 */
export function getPhishingAwarenessHtml(options: PhishingAwarenessEmailOptions): string {
  const { recipientName } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Awareness</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 8px 8px 0 0;">
              <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <span style="font-size: 48px;">🔒</span>
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">Stay Safe from Phishing</h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">
                Identify Legitimate Ketchup Messages
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 16px; line-height: 1.5;">
                Dear <strong>${recipientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Your security is our priority! Learn how to identify legitimate Ketchup SmartPay communications and protect yourself from phishing attacks.
              </p>
              
              <!-- Legitimate Emails Section -->
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #166534; font-size: 18px; font-weight: 600;">
                  ✓ Legitimate Ketchup Emails
                </h2>
                <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
                  <li>Always sent from: <strong>${CONTACT_EMAIL}</strong></li>
                  <li>Include Ketchup logo and official footer</li>
                  <li><strong>NEVER</strong> ask for your PIN or full password</li>
                  <li><strong>NEVER</strong> include links to external websites</li>
                  <li>Include security verification markers</li>
                </ul>
              </div>
              
              <!-- Legitimate SMS Section -->
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #166534; font-size: 18px; font-weight: 600;">
                  ✓ Legitimate Ketchup SMS
                </h2>
                <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
                  <li>Always start with: <strong>[KETCHUP OFFICIAL]</strong></li>
                  <li>Always end with fraud reporting number</li>
                  <li><strong>NEVER</strong> ask for your PIN</li>
                  <li>Keep messages concise (under 160 characters)</li>
                </ul>
              </div>
              
              <!-- Warning Signs Section -->
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #991b1b; font-size: 18px; font-weight: 600;">
                  ⚠️ Warning Signs of Phishing
                </h2>
                <ul style="margin: 0; padding-left: 20px; color: #991b1b; font-size: 14px; line-height: 1.8;">
                  <li>❌ Email from strange address (not @ketchup.cc)</li>
                  <li>❌ Asks for your PIN, password, or OTP code</li>
                  <li>❌ Urgent language ("Your account will be closed!")</li>
                  <li>❌ Links to unfamiliar websites</li>
                  <li>❌ Poor spelling or grammar</li>
                  <li>❌ Unexpected attachments</li>
                  <li>❌ Requests for sensitive information via reply</li>
                </ul>
              </div>
              
              <!-- What to Do Section -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #92400e; font-size: 18px; font-weight: 600;">
                  🛡️ If You Suspect Phishing
                </h2>
                <ol style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
                  <li><strong>DO NOT</strong> click any links</li>
                  <li><strong>DO NOT</strong> reply with personal information</li>
                  <li><strong>DO NOT</strong> download attachments</li>
                  <li>Forward suspicious emails to: <a href="mailto:fraud@ketchup.cc" style="color: #dc2626; text-decoration: none; font-weight: 600;">fraud@ketchup.cc</a></li>
                  <li>Delete suspicious SMS immediately</li>
                  <li>Call our fraud hotline: <strong>+264 61 123 4567</strong> (toll-free)</li>
                </ol>
              </div>
              
              <!-- Real Examples Section -->
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                Real Examples
              </h2>
              
              <!-- Legitimate Email Example -->
              <div style="background: #f8f9fa; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                <p style="margin: 0 0 12px; color: #22c55e; font-size: 14px; font-weight: 700;">
                  ✓ LEGITIMATE EMAIL
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">From:</td>
                    <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600; text-align: right;">${CONTACT_EMAIL}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Subject:</td>
                    <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; text-align: right;">Your Ketchup voucher (N$250) has been issued</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Footer:</td>
                    <td style="padding: 4px 0; color: #22c55e; font-size: 13px; font-weight: 600; text-align: right;">✓ Includes verification markers</td>
                  </tr>
                </table>
              </div>
              
              <!-- Phishing Email Example -->
              <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                <p style="margin: 0 0 12px; color: #dc2626; font-size: 14px; font-weight: 700;">
                  ❌ PHISHING EMAIL
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">From:</td>
                    <td style="padding: 4px 0; color: #dc2626; font-size: 13px; font-weight: 600; text-align: right;">ketchup-support@gmail.com</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Subject:</td>
                    <td style="padding: 4px 0; color: #dc2626; font-size: 13px; text-align: right;">URGENT: Verify your account now!</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Footer:</td>
                    <td style="padding: 4px 0; color: #dc2626; font-size: 13px; font-weight: 600; text-align: right;">❌ Missing or generic</td>
                  </tr>
                </table>
              </div>
              
              <!-- Legitimate SMS Example -->
              <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px; color: #22c55e; font-size: 13px; font-weight: 700;">
                  ✓ LEGITIMATE SMS
                </p>
                <p style="margin: 0; color: #166534; font-size: 12px; font-family: 'Courier New', monospace; line-height: 1.6;">
                  [KETCHUP OFFICIAL] Voucher N$250 issued. Code: ABC-123. Never share PIN. Report fraud: 081-234-5678
                </p>
              </div>
              
              <!-- Phishing SMS Example -->
              <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #dc2626; font-size: 13px; font-weight: 700;">
                  ❌ PHISHING SMS
                </p>
                <p style="margin: 0; color: #991b1b; font-size: 12px; font-family: 'Courier New', monospace; line-height: 1.6;">
                  Ketchup: Click here to claim your voucher: bit.ly/xyz123
                </p>
              </div>
              
              <!-- Remember Section -->
              <div style="padding: 24px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                  🔐 Remember
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8; text-align: left;">
                  <li>We will <strong>NEVER</strong> ask for your PIN or password</li>
                  <li>We will <strong>NEVER</strong> threaten to close your account</li>
                  <li>We will <strong>NEVER</strong> send you unsolicited links</li>
                  <li>We will <strong>NEVER</strong> ask you to urgently transfer funds</li>
                </ul>
                <p style="margin: 20px 0 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
                  Stay vigilant and stay safe!
                </p>
                <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                  Ketchup SmartPay Security Team
                </p>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Authentication Security Footer (SEC-008) -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px; margin-top: 0;">
          <tr>
            <td>
              ${getEmailFooterHtml()}
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
 * Generate complete phishing awareness email (subject, text, html).
 */
export function generatePhishingAwarenessEmail(options: PhishingAwarenessEmailOptions) {
  return {
    subject: getPhishingAwarenessSubject(),
    text: getPhishingAwarenessText(options),
    html: getPhishingAwarenessHtml(options),
  };
}
