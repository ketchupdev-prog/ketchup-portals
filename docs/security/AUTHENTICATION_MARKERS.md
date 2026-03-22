# Email/SMS Authentication Markers (SEC-008)

**Status:** ✅ Implemented  
**Due Date:** May 31, 2026 (Accelerated to Q1)  
**Priority:** High  
**Security Level:** Critical

## Overview

Email/SMS Authentication Markers help beneficiaries and users distinguish legitimate Ketchup SmartPay communications from phishing attempts. This system implements visible security indicators in all transactional emails and SMS messages.

## Problem Statement

Beneficiaries and portal users are vulnerable to phishing attacks where fraudsters impersonate Ketchup SmartPay to steal:
- Voucher codes
- Account credentials (passwords, PINs)
- Personal identification information
- OTP/2FA codes

Without clear authentication markers, users cannot easily verify whether a communication is legitimate.

## Solution

### Email Authentication Markers

All transactional emails include a standardized security footer with:

1. **Verification Section** (Yellow warning box)
   - Sent from: `ichigo@ketchup.cc`
   - Official Ketchup SmartPay Communication
   - Security reminder: "We NEVER ask for your PIN or password"

2. **Fraud Reporting Section**
   - Email: `fraud@ketchup.cc`
   - Phone: `+264 61 123 4567` (toll-free)

3. **Company Footer**
   - Ketchup logo
   - Bank of Namibia licensing information

### SMS Authentication Markers

All SMS messages include:

1. **Prefix:** `[KETCHUP OFFICIAL] ` (20 characters)
2. **Suffix:** ` Never share PIN. Report fraud: 081-234-5678` (45 characters)
3. **Content Space:** 95 characters (160 total - 65 for markers)

## Implementation

### File Structure

```
src/lib/
├── email-templates/
│   ├── components/
│   │   └── footer.ts                    # Reusable email footer component
│   ├── password-reset.ts                # Updated with auth footer
│   ├── voucher-notification.ts          # Voucher issuance emails
│   ├── fraud-alert.ts                   # Security alert emails
│   ├── welcome.ts                       # Welcome/onboarding emails
│   └── education/
│       └── phishing-awareness.ts        # User education template
├── sms-templates/
│   ├── authentication-marker.ts         # SMS auth marker utilities
│   └── templates.ts                     # Pre-built SMS templates
└── services/
    ├── email.ts                         # Email service (unchanged)
    └── sms.ts                           # Updated SMS service with auto-markers
```

### Email Footer Component

Located: `src/lib/email-templates/components/footer.ts`

**Functions:**
- `getEmailFooterText(options?)` - Plain text footer
- `getEmailFooterHtml(options?)` - HTML footer with inline styles
- `generateEmailFooter(options?)` - Both versions

**Usage:**
```typescript
import { getEmailFooterHtml, getEmailFooterText } from '@/lib/email-templates/components/footer';

// In HTML email
const html = `
  <body>
    <!-- Your email content -->
    ${getEmailFooterHtml()}
  </body>
`;

// In plain text email
const text = `
Your email content

${getEmailFooterText()}
`;
```

### Email Templates

#### 1. Password Reset (`password-reset.ts`)
- **Status:** ✅ Updated
- **Used by:** `/api/v1/auth/request-reset`
- **Changes:** Added authentication footer

#### 2. Voucher Notification (`voucher-notification.ts`)
- **Status:** ✅ Created
- **Used by:** Voucher issuance system
- **Features:** 
  - Voucher details card
  - Redemption instructions
  - Security warnings about code sharing
  - Authentication footer

#### 3. Fraud Alert (`fraud-alert.ts`)
- **Status:** ✅ Created
- **Used by:** Fraud detection system
- **Features:**
  - Urgent header styling
  - Alert details with timestamp
  - Recommended actions
  - Authorization verification prompt
  - Enhanced security footer

#### 4. Welcome Email (`welcome.ts`)
- **Status:** ✅ Created
- **Used by:** User registration/onboarding
- **Features:**
  - Multi-portal support
  - Account type customization
  - Getting started instructions
  - Security tips
  - Authentication footer

#### 5. Phishing Awareness (`education/phishing-awareness.ts`)
- **Status:** ✅ Created
- **Used by:** Security awareness campaigns
- **Features:**
  - Identification guidelines for legitimate emails/SMS
  - Warning signs of phishing
  - Real-world examples (good vs bad)
  - Action steps for suspected phishing
  - Authentication footer

### SMS Authentication System

Located: `src/lib/sms-templates/authentication-marker.ts`

**Core Functions:**

```typescript
// Format any message with auth markers
formatSMSWithAuthMarkers(message: string): string

// Check if message fits in single SMS
willFitInSingleSMS(message: string): boolean

// Get remaining character count
getRemainingChars(currentMessage: string): number

// Validate message length
validateSMSLength(message: string): { valid: boolean; error?: string }
```

**Constants:**
- `SMS_AUTH_PREFIX`: `[KETCHUP OFFICIAL] ` (20 chars)
- `SMS_AUTH_SUFFIX`: ` Never share PIN. Report fraud: 081-234-5678` (45 chars)
- `SMS_MAX_LENGTH`: 160 chars (GSM-7 single SMS)
- `SMS_CONTENT_MAX_LENGTH`: 95 chars

### SMS Templates

Located: `src/lib/sms-templates/templates.ts`

**Pre-built Templates:**

1. **Voucher Issuance**
   ```typescript
   generateVoucherIssuanceSMS({ amount, voucherCode, expiryDate })
   // [KETCHUP OFFICIAL] Voucher N$250 issued. Code: ABC-123. Valid until Mar 25. Never share PIN. Report fraud: 081-234-5678
   ```

2. **Fraud Alert**
   ```typescript
   generateFraudAlertSMS({ alertType, contactNumber })
   // [KETCHUP OFFICIAL] Suspicious activity detected. Call us: 061-123-4567. Never share PIN. Report fraud: 081-234-5678
   ```

3. **OTP/2FA**
   ```typescript
   generateOTPSMS({ otp, validityMinutes, purpose })
   // [KETCHUP OFFICIAL] Your OTP: 123456. Valid 5 mins. Never share PIN. Report fraud: 081-234-5678
   ```

4. **Password Reset**
   ```typescript
   generatePasswordResetSMS({ resetCode, validityMinutes })
   // [KETCHUP OFFICIAL] Reset code: 123456. Valid 10 mins. Never share PIN. Report fraud: 081-234-5678
   ```

5. **Welcome SMS**
   ```typescript
   generateWelcomeSMS({ firstName })
   // [KETCHUP OFFICIAL] Welcome to Ketchup SmartPay! Check your email for details. Never share PIN. Report fraud: 081-234-5678
   ```

6. **Custom Messages**
   ```typescript
   generateAuthenticatedSMS(message)
   ```

### SMS Service Updates

Located: `src/lib/services/sms.ts`

**Changes:**
1. Import authentication marker formatter
2. Add `skipAuthMarkers` option to `SmsOptions` (default: false)
3. Add `warning` field to `SmsResult` for truncation notices
4. Auto-apply markers in `sendSms()` unless explicitly disabled
5. New convenience function: `sendAuthenticatedSMS()`

**Updated Signature:**
```typescript
interface SmsOptions {
  to: string;
  message: string;
  reference?: string;
  skipAuthMarkers?: boolean; // NOT recommended
}

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  warning?: string; // "Message truncated to fit SMS limit"
}

// Always use authentication markers (recommended)
sendAuthenticatedSMS(options: Omit<SmsOptions, 'skipAuthMarkers'>): Promise<SmsResult>

// Allow skipping markers (NOT recommended)
sendSms(options: SmsOptions): Promise<SmsResult>
```

## Usage Guidelines

### For Email Templates

**✅ DO:**
- Always include the authentication footer in ALL transactional emails
- Use `getEmailFooterHtml()` for HTML emails
- Use `getEmailFooterText()` for plain text emails
- Include custom security notes when relevant (via `options.securityNote`)
- Test rendering across email clients (Gmail, Outlook, Apple Mail)

**❌ DON'T:**
- Remove or modify the authentication footer
- Create emails without the footer
- Use generic footers without security markers
- Hide the fraud reporting contact information

**Example:**
```typescript
import { generatePasswordResetEmail } from '@/lib/email-templates/password-reset';
import { sendEmail } from '@/lib/services/email';

const emailContent = generatePasswordResetEmail({
  resetLink: 'https://portal.ketchup.cc/reset?token=abc',
  portal: 'ketchup',
  recipientEmail: 'user@example.com',
});

await sendEmail({
  to: recipientEmail,
  subject: emailContent.subject,
  text: emailContent.text,
  html: emailContent.html,
});
```

### For SMS Messages

**✅ DO:**
- Use pre-built templates from `templates.ts` when possible
- Keep core messages under 95 characters
- Test messages with `willFitInSingleSMS()` before sending
- Use `sendAuthenticatedSMS()` for all user-facing SMS
- Handle truncation warnings gracefully

**❌ DON'T:**
- Skip authentication markers (set `skipAuthMarkers: true`) unless absolutely necessary
- Exceed 95 characters for core message content
- Include URLs or suspicious-looking links
- Ask for PINs, passwords, or OTPs in SMS

**Example:**
```typescript
import { generateVoucherIssuanceSMS } from '@/lib/sms-templates/templates';
import { sendAuthenticatedSMS } from '@/lib/services/sms';

const smsContent = generateVoucherIssuanceSMS({
  amount: 'N$250',
  voucherCode: 'ABC-123',
  expiryDate: 'Mar 25',
});

const result = await sendAuthenticatedSMS({
  to: '+264811234567',
  message: smsContent,
  reference: 'VOUCHER-001',
});

if (result.warning) {
  console.warn('SMS truncated:', result.warning);
}
```

## Security Best Practices

### Email Security

1. **Sender Verification**
   - All emails MUST come from `ichigo@ketchup.cc`
   - Configure SPF, DKIM, and DMARC records
   - Monitor for domain spoofing attempts

2. **Content Security**
   - Never include sensitive data in emails (PINs, full passwords)
   - Use secure, time-limited links for password resets
   - Include expiration times for all action links
   - Avoid external link redirects

3. **Footer Integrity**
   - Never modify the authentication footer structure
   - Ensure fraud reporting contact is always visible
   - Include Bank of Namibia licensing info

### SMS Security

1. **Sender ID**
   - Register official sender ID with SMS gateway
   - Monitor for SMS spoofing

2. **Message Content**
   - Never ask for PINs or passwords via SMS
   - Keep messages clear and actionable
   - Avoid URLs (use "Check email for link" instead)
   - Include fraud reporting number in every SMS

3. **Character Limits**
   - Stay under 95 characters for core content
   - Auto-truncation handles overflow gracefully
   - Test messages before production deployment

## Testing

### Email Testing Checklist

- [ ] HTML rendering in Gmail (desktop & mobile)
- [ ] HTML rendering in Outlook (Windows & Mac)
- [ ] HTML rendering in Apple Mail (macOS & iOS)
- [ ] Plain text fallback rendering
- [ ] Footer visibility across all clients
- [ ] Fraud reporting links are clickable
- [ ] Logo displays correctly
- [ ] Security warning box has correct styling
- [ ] Responsive design on mobile devices

### SMS Testing Checklist

- [ ] Messages under 160 characters total
- [ ] Prefix appears correctly: `[KETCHUP OFFICIAL]`
- [ ] Suffix appears correctly with fraud number
- [ ] Test on MTC (Mobile Telecommunications Company)
- [ ] Test on TN Mobile (Telecom Namibia)
- [ ] Test on different phone models
- [ ] Verify sender ID registration
- [ ] Test truncation with long messages

## Monitoring & Reporting

### Metrics to Track

1. **Phishing Reports**
   - Count of reports to `fraud@ketchup.cc`
   - Types of phishing attempts (email vs SMS)
   - User confusion or false reports

2. **Email Deliverability**
   - Open rates (track engagement)
   - Spam folder placement rates
   - Bounce rates

3. **SMS Delivery**
   - Delivery success rate
   - Character truncation frequency
   - User feedback on SMS clarity

### Incident Response

If a phishing attack is detected:

1. **Immediate Actions**
   - Alert security team
   - Notify affected users via official channels
   - Update phishing awareness materials

2. **Investigation**
   - Analyze phishing email/SMS content
   - Identify compromised accounts
   - Track fraud reports and financial impact

3. **Communication**
   - Send fraud alerts to all users
   - Update help center with new examples
   - Coordinate with Bank of Namibia if required

## User Education Campaign

### Initial Rollout

1. **Email Campaign**
   - Send phishing awareness email to all users
   - Schedule: First week of implementation
   - Template: `education/phishing-awareness.ts`

2. **In-Portal Notices**
   - Add banner to portal dashboards
   - Link to help center article
   - Include real phishing examples

3. **SMS Reminder**
   - One-time SMS to all beneficiaries
   - Explain authentication markers
   - Remind about fraud reporting number

### Ongoing Education

1. **Quarterly Updates**
   - New phishing examples
   - Security tips and reminders
   - Success stories (prevented fraud)

2. **Help Center**
   - Dedicated security section
   - Interactive examples (spot the phishing)
   - FAQ about authentication markers

3. **Agent Training**
   - Train agents to explain markers to beneficiaries
   - Provide scripts for common questions
   - Update agent portal help docs

## Compliance & Regulations

### Bank of Namibia Requirements

- E-money issuers must implement reasonable security measures
- Customer protection against fraud is mandatory
- Clear communication about security practices

### GDPR Considerations

- Fraud reporting emails may contain personal data
- Implement proper data handling for fraud reports
- Maintain audit logs for security incidents

## Migration Guide

### For Existing Email Templates

1. Import the footer component:
   ```typescript
   import { getEmailFooterHtml, getEmailFooterText } from '@/lib/email-templates/components/footer';
   ```

2. Add to HTML version (before `</body>`):
   ```typescript
   ${getEmailFooterHtml()}
   ```

3. Add to text version (at end):
   ```typescript
   ${getEmailFooterText()}
   ```

### For Existing SMS Sending

1. Import authentication SMS function:
   ```typescript
   import { sendAuthenticatedSMS } from '@/lib/services/sms';
   ```

2. Replace `sendSms()` with `sendAuthenticatedSMS()`:
   ```typescript
   // Before
   await sendSms({ to, message });
   
   // After
   await sendAuthenticatedSMS({ to, message });
   ```

3. Or use pre-built templates:
   ```typescript
   import { generateVoucherIssuanceSMS } from '@/lib/sms-templates/templates';
   
   const message = generateVoucherIssuanceSMS({ amount, voucherCode, expiryDate });
   await sendAuthenticatedSMS({ to, message });
   ```

## Contact & Support

- **Security Issues:** `fraud@ketchup.cc`
- **Technical Questions:** Development team
- **User Support:** `+264 61 123 4567` (toll-free)

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Mar 18, 2026 | Ketchup Dev Team | Initial implementation (SEC-008) |

## Related Documentation

- `docs/security/PHISHING_RESPONSE_PLAN.md` (to be created)
- `docs/security/EMAIL_SECURITY_POLICY.md` (to be created)
- `docs/security/SMS_SECURITY_POLICY.md` (to be created)

---

**Last Updated:** March 18, 2026  
**Next Review:** May 31, 2026
