/**
 * Neon Auth server instance – use for API handler, middleware, getSession, signIn (server).
 * Requires NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET in env. See docs/NEON_AUTH_SETUP.md.
 */

import { createNeonAuth } from "@neondatabase/neon-js/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

// `next build` (and Vercel) may evaluate this module before project env is present.
// Placeholders allow the build graph to compile; production traffic must set real values.
const buildSafeBaseUrl = baseUrl ?? "https://neon-auth.placeholder.invalid";
const buildSafeSecret =
  cookieSecret ?? "00000000000000000000000000000000";

if (
  process.env.VERCEL_ENV === "production" &&
  (!baseUrl || !cookieSecret)
) {
  throw new Error(
    "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are required for production"
  );
}

export const auth = createNeonAuth({
  baseUrl: buildSafeBaseUrl,
  cookies: {
    secret: buildSafeSecret,
  },
});
