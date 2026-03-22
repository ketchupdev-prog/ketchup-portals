/**
 * Welcome Email Template – Onboard new beneficiaries and portal users.
 * Used by: User registration, beneficiary onboarding.
 * Location: src/lib/email-templates/welcome.ts
 */

import { CONTACT_EMAIL } from '@/lib/contact';
import { type PortalSlug, PORTAL_AUTH } from '@/lib/portal-auth-config';
import { getEmailFooterText, getEmailFooterHtml } from './components/footer';

export interface WelcomeEmailOptions {
  recipientName: string;
  recipientEmail: string;
  portal: PortalSlug;
  loginUrl: string;
  accountType?: 'beneficiary' | 'agent' | 'portal_user';
  programmeDetails?: string;
}

/**
 * Generate welcome email subject.
 */
export function getWelcomeSubject(options: WelcomeEmailOptions): string {
  const portalLabel = PORTAL_AUTH[options.portal].label;
  return `Welcome to Ketchup SmartPay - ${portalLabel}`;
}

/**
 * Generate welcome email plain text.
 */
export function getWelcomeText(options: WelcomeEmailOptions): string {
  const { recipientName, portal, loginUrl, accountType, programmeDetails } = options;
  const portalLabel = PORTAL_AUTH[portal].label;

  const accountTypeText = {
    beneficiary: 'beneficiary',
    agent: 'authorized agent',
    portal_user: 'portal user',
  };

  return `
Welcome to Ketchup SmartPay!

Dear ${recipientName},

Your account has been successfully created. Welcome to the Ketchup SmartPay platform!

ACCOUNT DETAILS:
─────────────────
Portal: ${portalLabel}
Email: ${options.recipientEmail}
${accountType ? `Type: ${accountTypeText[accountType]}` : ''}

${programmeDetails ? `
PROGRAMME INFORMATION:
${programmeDetails}
` : ''}

GETTING STARTED:
1. Visit your portal: ${loginUrl}
2. Log in with your email and password
3. Complete your profile setup
4. Start using Ketchup SmartPay services

SECURITY TIPS:
• Keep your password secure and never share it
• Enable two-factor authentication (2FA) for extra security
• Watch out for phishing emails - we'll never ask for your password
• Contact us immediately if you notice suspicious activity

NEED HELP?
• Support Email: ${CONTACT_EMAIL}
• Help Center: https://portal.ketchup.cc/help
• Phone: +264 61 123 4567 (toll-free)

We're excited to have you on board!

Best regards,
The Ketchup SmartPay Team

---

${getEmailFooterText()}
`.trim();
}

/**
 * Generate welcome email HTML.
 */
export function getWelcomeHtml(options: WelcomeEmailOptions): string {
  const { recipientName, portal, loginUrl, accountType, programmeDetails } = options;
  const portalLabel = PORTAL_AUTH[portal].label;

  const accountTypeText = {
    beneficiary: 'Beneficiary',
    agent: 'Authorized Agent',
    portal_user: 'Portal User',
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ketchup SmartPay</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); border-radius: 8px 8px 0 0;">
              <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <span style="font-size: 48px;">🍅</span>
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 26px; font-weight: 700;">Welcome to Ketchup!</h1>
              <p style="margin: 8px 0 0; color: #ffe4e4; font-size: 14px;">
                ${portalLabel}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 18px; line-height: 1.5; font-weight: 600;">
                Dear ${recipientName},
              </p>
              
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Your account has been successfully created. Welcome to the Ketchup SmartPay platform! 🎉
              </p>
              
              <!-- Account Details -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #92400e; font-size: 16px; font-weight: 600;">
                  Account Details
                </h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #78350f; font-size: 14px;">Portal:</td>
                    <td style="padding: 6px 0; color: #92400e; font-size: 14px; font-weight: 600; text-align: right;">${portalLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #78350f; font-size: 14px;">Email:</td>
                    <td style="padding: 6px 0; color: #92400e; font-size: 14px; font-weight: 600; text-align: right;">${options.recipientEmail}</td>
                  </tr>
                  ${accountType ? `
                  <tr>
                    <td style="padding: 6px 0; color: #78350f; font-size: 14px;">Type:</td>
                    <td style="padding: 6px 0; color: #92400e; font-size: 14px; font-weight: 600; text-align: right;">${accountTypeText[accountType]}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              ${programmeDetails ? `
              <!-- Programme Information -->
              <div style="background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 12px; color: #075985; font-size: 16px; font-weight: 600;">
                  Programme Information
                </h2>
                <p style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.6; white-space: pre-line;">
                  ${programmeDetails}
                </p>
              </div>
              ` : ''}
              
              <!-- Getting Started -->
              <div style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                  Getting Started
                </h2>
                <ol style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                  <li>Visit your portal using the button below</li>
                  <li>Log in with your email and password</li>
                  <li>Complete your profile setup</li>
                  <li>Start using Ketchup SmartPay services</li>
                </ol>
              </div>
              
              <!-- Login Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${loginUrl}" 
                       style="display: inline-block; padding: 14px 32px; background-color: #ff6b6b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 8px rgba(255,107,107,0.3);">
                      Access Your Portal →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Security Tips -->
              <div style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #166534; font-size: 15px; font-weight: 600;">
                  🔐 Security Tips
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 13px; line-height: 1.6;">
                  <li>Keep your password secure and never share it</li>
                  <li>Enable two-factor authentication (2FA) for extra security</li>
                  <li>Watch out for phishing emails - we'll never ask for your password</li>
                  <li>Contact us immediately if you notice suspicious activity</li>
                </ul>
              </div>
              
              <!-- Support -->
              <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 8px;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                  Need Help?
                </h3>
                <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                  Support: <a href="mailto:${CONTACT_EMAIL}" style="color: #ff6b6b; text-decoration: none; font-weight: 600;">${CONTACT_EMAIL}</a>
                </p>
                <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                  Help Center: <a href="https://portal.ketchup.cc/help" style="color: #ff6b6b; text-decoration: none;">portal.ketchup.cc/help</a>
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                  Phone: <strong>+264 61 123 4567</strong> (toll-free)
                </p>
              </div>
              
              <!-- Closing -->
              <p style="margin: 24px 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.5; text-align: center;">
                We're excited to have you on board!<br/>
                <strong style="color: #1a1a1a;">The Ketchup SmartPay Team</strong>
              </p>
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
 * Generate complete welcome email (subject, text, html).
 */
export function generateWelcomeEmail(options: WelcomeEmailOptions) {
  return {
    subject: getWelcomeSubject(options),
    text: getWelcomeText(options),
    html: getWelcomeHtml(options),
  };
}
