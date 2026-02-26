# Neon + Drizzle setup (Ketchup Portals)

This project uses **Neon** (serverless Postgres) with **Drizzle ORM** and the **HTTP adapter** for Vercel/serverless. The setup follows [Neon’s Drizzle integration guidelines](https://github.com/neondatabase-labs/ai-rules/blob/main/neon-drizzle.mdc) and [Neon Serverless driver](https://github.com/neondatabase-labs/ai-rules/blob/main/neon-serverless.mdc).

## Connection

- **Driver:** `@neondatabase/serverless` → `neon()` (HTTP)
- **ORM:** `drizzle-orm/neon-http` with `drizzle(sql, { schema })`
- **Config:** `src/lib/db.ts` uses lazy init so `next build` does not require `DATABASE_URL` at import time; runtime API routes need `DATABASE_URL` set.

## Connection string

Use a Neon connection string with `sslmode=require` and `channel_binding=require`:

```text
DATABASE_URL="postgresql://[user]:[password]@[neon_hostname]/[dbname]?sslmode=require&channel_binding=require"
```

Set in `.env.local` (local) and in Vercel (or your host) environment variables.

## Schema and migrations

- **Schema:** `src/db/schema.ts` (all tables per `docs/DATABASE_AND_API_DESIGN.md`)
- **Config:** `drizzle.config.ts` loads `.env.local` so Drizzle Kit can see `DATABASE_URL`

Commands:

```bash
# Generate migration files after schema changes
npx drizzle-kit generate

# Push schema to Neon (no migration files)
npx drizzle-kit push

# Run migrations (if using migrate)
npx drizzle-kit migrate
```

## Build and deploy

- **Build:** Set `DATABASE_URL` when running `next build` (e.g. in CI/Vercel) so API routes that touch the DB can be collected.
- **Runtime:** All `/api/v1/*` routes that use `db` require `DATABASE_URL` in the environment.

## References

- Neon + Drizzle: [neon-drizzle.mdc](https://github.com/neondatabase-labs/ai-rules/blob/main/neon-drizzle.mdc)
- Neon Serverless driver: [neon-serverless.mdc](https://github.com/neondatabase-labs/ai-rules/blob/main/neon-serverless.mdc)
- Database & API design: [DATABASE_AND_API_DESIGN.md](./DATABASE_AND_API_DESIGN.md)
