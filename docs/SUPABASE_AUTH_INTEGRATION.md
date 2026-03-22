# Supabase Auth Integration Guide

## Overview

Ketchup Portals now uses **Supabase Auth** for centralized authentication, shared with Buffr Connect. This enables:

- ✅ **Single Sign-On (SSO)** across beneficiaries, operators, and bank users
- ✅ **Shared user identity** (Supabase Auth `user_id`)
- ✅ **Consistent session management** with JWT tokens
- ✅ **Integration with Open Banking** consent flows
- ✅ **Secure webhook handling** for Buffr events

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Auth                             │
│              (cjmtcxfpwjbpbctjseex)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Beneficiaries│  │   Operators  │  │    Banks     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Buffr Connect  │  │ Ketchup Portals │  │  Bank Systems   │
│   (Main API)    │  │  (Portal App)   │  │   (v5 Banks)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Setup Instructions

### 1. Environment Variables

Copy the canonical Supabase credentials from `buffr-connect/buffrconnect/.env.local`:

```bash
# In ketchup-portals/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://cjmtcxfpwjbpbctjseex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_AUTH_URL=https://cjmtcxfpwjbpbctjseex.supabase.co/auth/v1

# Enable auth protection (set to 'true' in production)
NEXT_PUBLIC_REQUIRE_AUTH=false

# Buffr Connect API
BUFFR_API_URL=http://localhost:3000/api
BUFFR_API_KEY=your_buffr_api_key
BUFFR_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Database Migration

Run the migration to add `supabase_user_id` to `portal_users`:

```bash
# Apply the migration
npm run db:push

# Or manually run the SQL:
psql $DATABASE_URL -f migrations/0001_add_supabase_user_id.sql
```

### 3. Verify Connection

Test Supabase connection:

```bash
npm run test -- src/__tests__/integration/supabase-auth.test.ts
```

## Usage

### Server-Side Authentication

```typescript
import { createClient, getSession, getUser } from '@/lib/supabase/server';

// In API routes
export async function GET(request: Request) {
  const supabase = await createClient();
  const session = await getSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use session.user.id to query portal_users
  const [portalUser] = await db
    .select()
    .from(portalUsers)
    .where(eq(portalUsers.supabaseUserId, session.user.id))
    .limit(1);
  
  return Response.json({ user: portalUser });
}
```

### Client-Side Authentication

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return <div>User: {user?.email}</div>;
}
```

### Login/Register

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// Register
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, fullName, role }),
});

// Logout
const response = await fetch('/api/auth/logout', {
  method: 'POST',
});
```

## Buffr Connect Integration

### SDK Usage

```typescript
import {
  checkAffordability,
  getAccountBalance,
  getTransactions,
  getConsentStatus,
} from '@/lib/integrations/buffr/client';

// Check affordability before voucher issuance
const result = await checkAffordability({
  userId: beneficiary.supabaseUserId,
  amount: 5000,
  currency: 'NAD',
});

if (result.affordable) {
  // Issue voucher
}

// Get account balance
const balance = await getAccountBalance(accountId);

// Get transaction history
const transactions = await getTransactions(accountId, {
  from: '2026-01-01',
  to: '2026-03-31',
  limit: 50,
});
```

### Webhook Handling

Buffr Connect sends webhook events for:
- `consent.created` / `consent.granted`
- `consent.revoked` / `consent.expired`
- `transaction.created`
- `affordability.checked`

Configure webhook in Buffr Connect:
- **URL**: `https://your-domain.com/api/v1/webhooks/buffr`
- **Secret**: Use the same value as `BUFFR_WEBHOOK_SECRET`

## Middleware

The Next.js middleware now:
1. ✅ Refreshes Supabase sessions automatically
2. ✅ Manages auth cookies properly
3. ✅ Redirects unauthenticated users to `/login`
4. ✅ Preserves redirect URLs for post-login navigation

Protected routes:
- `/ketchup/*` (Ketchup Ops Portal)
- `/government/*` (Government Portal)
- `/agent/*` (Agent Portal)
- `/field-ops/*` (Field Operations Portal)

## Troubleshooting

### Issue: "Session not found" errors

**Solution**: Ensure `NEXT_PUBLIC_REQUIRE_AUTH=false` during development.

### Issue: Webhook signature verification fails

**Solution**: Verify `BUFFR_WEBHOOK_SECRET` matches in both projects.

### Issue: User not found in portal_users

**Solution**: The sync happens on first login. If missing, manually link:

```sql
UPDATE portal_users 
SET supabase_user_id = 'uuid-from-supabase-auth'
WHERE email = 'user@example.com';
```

### Issue: CORS errors with Supabase

**Solution**: Ensure Supabase project has correct CORS settings:
- Go to Supabase Dashboard → Authentication → URL Configuration
- Add your domain to "Site URL" and "Redirect URLs"

## Security Considerations

1. ✅ **Never expose service role key** in client-side code
2. ✅ **Always verify webhook signatures** using `BUFFR_WEBHOOK_SECRET`
3. ✅ **Use RLS policies** in Supabase for data access control
4. ✅ **Rotate keys regularly** (quarterly recommended)
5. ✅ **Enable MFA** for production accounts

## Testing

Run integration tests:

```bash
# Supabase Auth tests
npm run test -- src/__tests__/integration/supabase-auth.test.ts

# Buffr SDK tests
npm run test -- src/__tests__/integration/buffr-sdk.test.ts

# All integration tests
npm run test -- src/__tests__/integration/
```

## Migration Checklist

- [x] Environment variables updated
- [x] Supabase client utilities created
- [x] Database schema updated with `supabase_user_id`
- [x] Middleware updated for session management
- [x] Auth routes migrated to Supabase
- [x] Buffr SDK integrated
- [x] Webhook handlers implemented
- [x] Integration tests created
- [x] Documentation completed

## Next Steps

1. **Enable auth protection**: Set `NEXT_PUBLIC_REQUIRE_AUTH=true` in production
2. **Migrate existing users**: Link existing `portal_users` to Supabase users
3. **Configure webhooks**: Set up webhook endpoint in Buffr Connect
4. **Monitor logs**: Watch for auth and webhook errors in production
5. **Enable MFA**: Consider enforcing 2FA for sensitive operations

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Buffr Connect**: See `buffr-connect/buffrconnect/README.md`
- **Issues**: Contact the development team

---

**Last Updated**: March 21, 2026
