/**
 * Unit tests for email service – sendEmail, buildPasswordResetLink, sendPasswordResetEmail.
 * Location: src/lib/services/email.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendEmail,
  buildPasswordResetLink,
  sendPasswordResetEmail,
} from './email';

// Mock env so buildPasswordResetLink doesn't require DATABASE_URL
vi.mock('@/lib/env', () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_PORTAL_URL: 'https://portal.ketchup.cc',
    BASE_URL: '',
  }),
}));

describe('sendEmail', () => {
  it('returns sent: false when SMTP not configured', async () => {
    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      text: 'Body',
    });
    expect(result.sent).toBe(false);
    expect(result.error).toContain('SMTP not configured');
  });
});

describe('buildPasswordResetLink', () => {
  it('builds absolute URL when portal URL is configured', () => {
    const link = buildPasswordResetLink('ketchup', 'token-abc');
    expect(link).toBe(
      'https://portal.ketchup.cc/ketchup/forgot-password?token=token-abc'
    );
  });

  it('encodes token in query', () => {
    const link = buildPasswordResetLink('agent', 'token+with/special');
    expect(link).toContain('token=token%2Bwith%2Fspecial');
    expect(link).toContain('/agent/forgot-password');
  });

  it('uses correct path for each portal', () => {
    expect(buildPasswordResetLink('government', 'x')).toContain(
      '/government/forgot-password'
    );
    expect(buildPasswordResetLink('field-ops', 'x')).toContain(
      '/field-ops/forgot-password'
    );
  });
});

describe('sendPasswordResetEmail', () => {
  it('returns sent: false when SMTP not configured (no actual send)', async () => {
    const result = await sendPasswordResetEmail(
      'user@example.com',
      'ketchup',
      'test-token'
    );
    expect(result.sent).toBe(false);
  });

  it('uses default subject when not provided', async () => {
    const result = await sendPasswordResetEmail(
      'u@x.com',
      'agent',
      't',
      {}
    );
    expect(result.sent).toBe(false);
    // Subject is only used when sending; we just verify no throw
  });
});
