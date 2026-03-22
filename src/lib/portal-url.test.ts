/**
 * Unit tests for portal base URL helper.
 * Location: src/lib/portal-url.test.ts
 */

import { describe, it, expect, afterEach } from 'vitest';
import { getPortalBaseUrl, buildPortalUrl } from './portal-url';
import type { ServerEnv } from './env';

describe('getPortalBaseUrl', () => {
  const origEnv = process.env.NEXT_PUBLIC_PORTAL_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_PORTAL_URL = origEnv;
  });

  it('returns NEXT_PUBLIC_PORTAL_URL when serverEnv provided with it', () => {
    const env = { NEXT_PUBLIC_PORTAL_URL: 'https://portal.ketchup.cc', BASE_URL: '' } as ServerEnv;
    expect(getPortalBaseUrl(env)).toBe('https://portal.ketchup.cc');
  });

  it('falls back to BASE_URL when NEXT_PUBLIC_PORTAL_URL empty', () => {
    const env = { NEXT_PUBLIC_PORTAL_URL: '', BASE_URL: 'https://localhost:3000' } as ServerEnv;
    expect(getPortalBaseUrl(env)).toBe('https://localhost:3000');
  });

  it('strips trailing slash from base', () => {
    const env = { NEXT_PUBLIC_PORTAL_URL: 'https://portal.ketchup.cc/', BASE_URL: '' } as ServerEnv;
    expect(getPortalBaseUrl(env)).toBe('https://portal.ketchup.cc');
  });

  it('returns empty when no serverEnv and env var unset', () => {
    process.env.NEXT_PUBLIC_PORTAL_URL = '';
    expect(getPortalBaseUrl(null)).toBe('');
  });

  it('uses process.env.NEXT_PUBLIC_PORTAL_URL when serverEnv not provided', () => {
    process.env.NEXT_PUBLIC_PORTAL_URL = 'https://portal.ketchup.cc';
    expect(getPortalBaseUrl(undefined)).toBe('https://portal.ketchup.cc');
  });
});

describe('buildPortalUrl', () => {
  it('prepends base when serverEnv has NEXT_PUBLIC_PORTAL_URL', () => {
    const env = { NEXT_PUBLIC_PORTAL_URL: 'https://portal.ketchup.cc', BASE_URL: '' } as ServerEnv;
    expect(buildPortalUrl('/ketchup/login', env)).toBe('https://portal.ketchup.cc/ketchup/login');
  });

  it('returns path only when base empty', () => {
    process.env.NEXT_PUBLIC_PORTAL_URL = '';
    expect(buildPortalUrl('/ketchup/login', null)).toBe('/ketchup/login');
  });

  it('normalizes path without leading slash', () => {
    const env = { NEXT_PUBLIC_PORTAL_URL: 'https://portal.ketchup.cc', BASE_URL: '' } as ServerEnv;
    expect(buildPortalUrl('ketchup/login', env)).toBe('https://portal.ketchup.cc/ketchup/login');
  });
});
