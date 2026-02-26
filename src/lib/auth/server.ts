/**
 * Neon Auth server instance – use for API handler, middleware, getSession, signIn (server).
 * Requires NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET in env. See docs/NEON_AUTH_SETUP.md.
 */

import { createNeonAuth } from "@neondatabase/neon-js/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

export const auth = createNeonAuth({
  baseUrl: baseUrl!,
  cookies: {
    secret: cookieSecret!,
  },
});
