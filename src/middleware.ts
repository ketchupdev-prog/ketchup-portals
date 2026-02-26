/**
 * Next.js Middleware – Protect portal routes (PRD §7.1).
 * Redirects unauthenticated users to /login for /ketchup, /government, /agent, /field-ops.
 * When Supabase Auth is integrated, check session/token here.
 */

import { NextRequest, NextResponse } from 'next/server';

const PORTAL_PATHS = ['/ketchup', '/government', '/agent', '/field-ops'];
const AUTH_PATHS = ['/login', '/register'];

function isPortalPath(pathname: string): boolean {
  return PORTAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optional: check for auth cookie when Supabase is wired (e.g. sb-*-auth-token)
  const hasAuthCookie = request.cookies.get('sb-auth-token') ?? request.cookies.get('portal-auth');

  // Enable redirect when NEXT_PUBLIC_REQUIRE_AUTH=true (e.g. after Supabase Auth is wired)
  if (process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true' && isPortalPath(pathname) && !hasAuthCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/ketchup/:path*',
    '/government/:path*',
    '/agent/:path*',
    '/field-ops/:path*',
  ],
};
