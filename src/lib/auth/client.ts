/**
 * Neon Auth client for use in client components (useSession, signIn, signOut, etc.).
 * Requires NEXT_PUBLIC_NEON_AUTH_URL or NEON_AUTH_BASE_URL in env. See docs/NEON_AUTH_SETUP.md.
 */

"use client";

import { createAuthClient } from "@neondatabase/neon-js/auth/next";

export const authClient = createAuthClient();
