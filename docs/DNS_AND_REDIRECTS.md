# DNS & Redirects for Ketchup Portals

Per-portal auth URLs and optional DNS/subdomain setup so each portal can have its own sign-in URL (e.g. for subdomains or separate domains).

## Per-portal auth URLs

Each portal has its own login and forgot-password pages:

| Portal      | Login              | Forgot password              |
|------------|---------------------|------------------------------|
| Ketchup    | `/ketchup/login`    | `/ketchup/forgot-password`   |
| Government | `/government/login` | `/government/forgot-password` |
| Agent      | `/agent/login`      | `/agent/forgot-password`     |
| Field Ops  | `/field-ops/login`  | `/field-ops/forgot-password` |

- **Redirect param:** `?redirect=/ketchup/dashboard` (or any path) sends the user back after sign-in.
- **Forgot password:** `?returnTo=/ketchup/dashboard` (or `redirect`) is used as the post-reset destination.
- **Config:** `src/lib/portal-auth-config.ts` defines `PORTAL_AUTH`, `getPortalFromPath()`, `getPortalLoginPath()`, `getPortalForgotPasswordPath()`.

## Global `/login` and `/forgot-password`

- **`/login`** – If `?redirect=` points to a portal path (e.g. `/ketchup/dashboard`), the app redirects to that portal’s login (e.g. `/ketchup/login?redirect=...`). Otherwise it shows Agent portal login.
- **`/forgot-password`** – Same idea: redirect to the portal’s forgot-password page when `returnTo`/`redirect` matches a portal path.

So linking to `/login?redirect=/ketchup/dashboard` still works and will redirect to `/ketchup/login?redirect=/ketchup/dashboard`.

## 401 redirects

When a user is unauthenticated (e.g. session expired):

- **Portal layout** and **portal-fetch** infer the portal from the current pathname and redirect to that portal’s login, e.g. `/ketchup/dashboard` → `/ketchup/login?redirect=/ketchup/dashboard`.

## DNS / subdomain setup (optional)

To give each portal its own hostname (e.g. for branding or SSO):

1. **Subdomains (same app):**  
   - `ketchup.example.com` → same Next.js app, path `/ketchup/*`.  
   - Use middleware or host header to rewrite: e.g. `ketchup.example.com` → `example.com/ketchup` (or keep path and show Ketchup content by host).  
   - Login for that host: redirect to `https://ketchup.example.com/ketchup/login` (or `/login` with `redirect=/ketchup/dashboard`).

2. **Vercel / hosting:**  
   - Add domains: `ketchup.example.com`, `agent.example.com`, etc.  
   - In middleware, read `request.nextUrl.hostname` and, if it matches a portal subdomain, set a header or cookie for “portal” and optionally redirect root to that portal’s dashboard or login.  
   - Example: `agent.example.com` → redirect `/` to `/agent/dashboard` (or `/agent/login` if unauthenticated).

3. **Middleware example (conceptual):**

   ```ts
   // middleware.ts – extend existing middleware
   const PORTAL_HOSTS: Record<string, string> = {
     'ketchup': 'ketchup.example.com',
     'government': 'government.example.com',
     'agent': 'agent.example.com',
     'field-ops': 'field-ops.example.com',
   };
   // If request is for agent.example.com and path is /login, rewrite to /agent/login (or serve /agent/login).
   ```

4. **Landing vs portals:**  
   - Main domain `www.example.com` or `example.com` → landing (`/`) and `/login` (global).  
   - Portal subdomains → serve only that portal’s routes; “Back to home” can link to `https://www.example.com/`.

## Summary

- Use **per-portal auth URLs** (`/ketchup/login`, etc.) everywhere (landing, footer, 401 redirects).
- **Global `/login` and `/forgot-password`** redirect to the right portal when `redirect`/`returnTo` is a portal path.
- **DNS/subdomains** are optional; use middleware and host-based rules to map subdomains to portal paths and login.
