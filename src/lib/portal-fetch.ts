/**
 * portal-fetch.ts
 * Portal API fetch helper: sends credentials and redirects to portal-specific login on 401.
 * Use for portal pages so session expiry during use redirects to the correct portal login (e.g. /ketchup/login).
 * Location: src/lib/portal-fetch.ts
 */

import { getPortalFromPath, getPortalLoginPath } from './portal-auth-config';

export async function portalFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: "include" });
  if (res.status === 401 && typeof window !== "undefined") {
    const path = window.location.pathname || "/ketchup/dashboard";
    const portal = getPortalFromPath(path) ?? "ketchup";
    const loginUrl = getPortalLoginPath(portal, path);
    window.location.href = loginUrl;
    throw new Error("Unauthorized");
  }
  return res;
}
