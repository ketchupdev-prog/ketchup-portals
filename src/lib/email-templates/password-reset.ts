/**
 * Password Reset Email Template – HTML email with reset link.
 * Used by: /api/v1/auth/request-reset
 * Location: src/lib/email-templates/password-reset.ts
 */

import { type PortalSlug, PORTAL_AUTH } from '@/lib/portal-auth-config';
import { CONTACT_EMAIL } from '@/lib/contact';
import { getEmailFooterText, getEmailFooterHtml } from './components/footer';

export interface PasswordResetEmailOptions {
  resetLink: string;
  portal: PortalSlug;
  recipientEmail: string;
}

/**
 * Generate password reset email subject.
 */
export function getPasswordResetSubject(portal: PortalSlug): string {
  const portalLabel = PORTAL_AUTH[portal].label;
  return `Reset your ${portalLabel} password`;
}

/**
 * Generate password reset email plain text.
 */
export function getPasswordResetText(options: PasswordResetEmailOptions): string {
  const { resetLink, portal } = options;
  const portalLabel = PORTAL_AUTH[portal].label;

  return `
You requested a password reset for your ${portalLabel} account.

Click the link below to reset your password:
${resetLink}

This link will expire in 24 hours.

If you didn't request this password reset, you can safely ignore this email.
Your password will remain unchanged.

---

${getEmailFooterText()}
`.trim();
}

/**
 * Generate password reset email HTML.
 * Uses inline styles for email client compatibility.
 */
export function getPasswordResetHtml(options: PasswordResetEmailOptions): string {
  const { resetLink, portal } = options;
  const portalLabel = PORTAL_AUTH[portal].label;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #ff6b6b; border-radius: 8px 8px 0 0;">
              <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <span style="font-size: 48px;">🍅</span>
              </div>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px; font-weight: 600;">Ketchup</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                Reset Your Password
              </h2>
              
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                You requested a password reset for your <strong>${portalLabel}</strong> account.
              </p>
              
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Click the button below to reset your password:
              </p>
              
              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${resetLink}" 
                       style="display: inline-block; padding: 14px 32px; background-color: #ff6b6b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 8px rgba(255,107,107,0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Link Alternative -->
              <p style="margin: 0 0 24px; color: #6a6a6a; font-size: 14px; line-height: 1.5;">
                Or copy and paste this link into your browser:
              </p>
              
              <div style="padding: 12px; background-color: #f8f8f8; border-radius: 4px; margin-bottom: 24px; word-break: break-all;">
                <a href="${resetLink}" style="color: #ff6b6b; text-decoration: none; font-size: 14px;">
                  ${resetLink}
                </a>
              </div>
              
              <!-- Expiry Notice -->
              <div style="padding: 16px; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                  ⏱️ <strong>This link expires in 24 hours.</strong> After that, you'll need to request a new password reset.
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="padding: 16px; background-color: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px; margin-bottom: 0;">
                <p style="margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.5;">
                  🔒 <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>
          
        </table>
        
        <!-- Authentication Security Footer (SEC-008) -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px;">
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
 * Generate complete password reset email (subject, text, html).
 * Use with sendEmail from @/lib/services/email.
 * 
 * @example
 * const emailContent = generatePasswordResetEmail({
 *   resetLink: 'https://portal.ketchup.com/ketchup/reset-password?token=abc123',
 *   portal: 'ketchup',
 *   recipientEmail: 'john@example.com',
 * });
 * 
 * await sendEmail({
 *   to: recipientEmail,
 *   subject: emailContent.subject,
 *   text: emailContent.text,
 *   html: emailContent.html,
 * });
 */
export function generatePasswordResetEmail(options: PasswordResetEmailOptions) {
  return {
    subject: getPasswordResetSubject(options.portal),
    text: getPasswordResetText(options),
    html: getPasswordResetHtml(options),
  };
}
