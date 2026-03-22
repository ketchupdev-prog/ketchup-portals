/**
 * Next.js Middleware – Protect portal routes with Supabase Auth (PRD §7.1).
 * Manages Supabase session cookies and redirects unauthenticated users to /login.
 * Per-portal subdomains (docs/DNS_AND_REDIRECTS.md): host root / → that portal's path.
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

const PORTAL_PATHS = ['/ketchup', '/government', '/agent', '/field-ops', '/admin'];
const AUTH_PATHS = ['/login', '/register', '/auth'];
const PUBLIC_PATHS = ['/', '/api/health', '/api/v1/webhooks'];

/** Subdomain → portal path. Add these domains in Vercel + DNS to use. */
const PORTAL_HOSTS: Record<string, string> = {
  'admin.ketchup.cc': '/ketchup',
  'gov.ketchup.cc': '/government',
  'agent.ketchup.cc': '/agent',
  'mobile.ketchup.cc': '/field-ops',
};

function isPortalPath(pathname: string): boolean {
  return PORTAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.nextUrl.hostname;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - this will extend the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Per-portal subdomain: redirect / to that portal (e.g. gov.ketchup.cc → /government)
  const portalPath = PORTAL_HOSTS[host];
  if (portalPath && (pathname === '/' || pathname === '')) {
    return NextResponse.redirect(new URL(portalPath, request.url));
  }

  // Skip auth checks for public paths and auth paths
  if (isPublicPath(pathname) || isAuthPath(pathname)) {
    return response;
  }

  // Check if authentication is required
  const requireAuth = process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true';

  // Redirect to login if accessing protected portal path without session
  if (requireAuth && isPortalPath(pathname) && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/ketchup/:path*',
    '/government/:path*',
    '/agent/:path*',
    '/field-ops/:path*',
    '/admin/:path*',
  ],
};
