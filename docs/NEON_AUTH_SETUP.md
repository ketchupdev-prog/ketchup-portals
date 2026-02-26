# Neon Auth Setup

This app is wired for **Neon Auth** (Better Auth on your Neon database). Auth data lives in the `neon_auth` schema in the same Neon project as your app data.

## 1. Get credentials from Neon

### Option A: Neon Console (recommended)

1. Open [Neon Console](https://console.neon.tech) and select your project (the one whose `DATABASE_URL` you use).
2. Go to the **Auth** tab (or **Neon Auth** in the sidebar).
3. If Neon Auth is not enabled, turn it **On**.
4. Copy the **Auth URL** (e.g. `https://ep-xxx.neon.tech/neondb/auth` or `https://ep-xxx.neonauth..../dbname/auth`).

### Option B: Neon MCP (Stack Auth alternative)

If you use the **Neon MCP** in Cursor and prefer **Stack Auth** instead of Better Auth:

1. Ensure the Neon MCP is connected (API key configured).
2. Call the **`provision_neon_auth`** tool with your Neon **project ID** (and optional database name).
3. The tool creates a `neon_auth` schema and returns:
   - `NEXT_PUBLIC_STACK_PROJECT_ID`
   - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
   - `STACK_SECRET_SERVER_KEY`
4. Follow the Stack Auth setup (e.g. `npx @stackframe/init-stack . --no-browser`) and use those env vars. This repo’s Neon Auth (Better Auth) setup is separate; use either Neon Auth **or** Stack Auth for the app’s main login.

## 2. Configure environment variables

In `.env.local` (or Vercel env vars) set:

```bash
NEON_AUTH_BASE_URL=https://ep-xxx.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=your-secret-at-least-32-characters-long
NEXT_PUBLIC_NEON_AUTH_URL=https://ep-xxx.neon.tech/neondb/auth
```

- Use the **exact** Auth URL from the Neon Console. Both URL variables are used (server and client).
- `NEON_AUTH_COOKIE_SECRET`: generate with `openssl rand -base64 32`; required for the Next.js auth handler (cookie signing).

## 3. What’s already in the repo

- **`src/app/api/auth/[...path]/route.ts`** – Catch-all handler for Neon Auth (`/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/sign-out`, `/api/auth/session`, etc.).
- **`src/lib/auth/client.ts`** – `authClient` for client components (`useSession()`, `signIn`, `signOut`, etc.).
- **`@neondatabase/neon-js`** – Installed; Neon Auth APIs live under `@neondatabase/neon-js/auth/next` and `auth/next/server`.

## 4. Optional: use Neon Auth UI and protected routes

- **Pre-built auth pages**  
  Add a route that uses Neon’s `<AuthView />` (e.g. `/auth/sign-in`, `/auth/sign-up`) and link your “Sign in” button to `/auth/sign-in`.  
  See [Neon Auth – Next.js UI](https://neon.tech/guides/neon-auth-nextjs) (AuthView, NeonAuthUIProvider, UserButton).

- **Protected routes**  
  You can use `neonAuthMiddleware` from `@neondatabase/neon-js/auth/next/server` in `middleware.ts` to redirect unauthenticated users to `/auth/sign-in` for chosen paths.

- **Server-side user**  
  In Server Components or API routes, use `neonAuth()` from `@neondatabase/neon-js/auth/next/server` to get the current user.

## 5. Database schema (Drizzle)

Neon Auth creates and owns the `neon_auth` schema. To include it in Drizzle:

- In `drizzle.config.ts`, set `schemaFilter: ['public', 'neon_auth']`.
- Run `npx drizzle-kit pull` to introspect and generate schema for `neon_auth` if you need to reference it (e.g. foreign keys from `public` tables to `neon_auth.user`).

## 6. Relation to existing login

- **`POST /api/v1/auth/login`** and **`POST /api/v1/auth/register`** still use the **`portal_users`** table and bcrypt. They are for API or programmatic use.
- **Neon Auth** is for the web app’s session-based login (cookies, AuthView, `authClient`). You can keep both: e.g. portal UI uses Neon Auth; external or mobile clients use `/api/v1/auth/login`.

## References

- [Neon Auth overview](https://neon.com/docs/auth/overview)
- [Neon Auth + Next.js guide](https://neon.tech/guides/neon-auth-nextjs)
- [Neon Auth UI components](https://neon.com/docs/auth/reference/ui-components)
