/**
 * Neon Auth API handler – catch-all for /api/auth/* (sign-in, sign-up, sign-out, session, etc.).
 * Requires NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET in env. See docs/NEON_AUTH_SETUP.md.
 */

import { auth } from "@/lib/auth/server";

export const { GET, POST } = auth.handler();
