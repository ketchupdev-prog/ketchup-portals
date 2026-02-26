/**
 * GET /auth/logout – Clear portal-auth cookie and redirect to /login.
 */

import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'portal-auth';

export async function GET(request: NextRequest) {
  const redirect = request.nextUrl.searchParams.get('redirect') ?? '/login';
  const res = NextResponse.redirect(new URL(redirect, request.url));
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' });
  return res;
}
