# Neon + Drizzle + Next.js – Database setup and migrations

Reference: **Archon MCP** (Drizzle docs), **Neon MCP** (neon-drizzle integration guide). This doc aligns ketchup-portals with Neon and Drizzle best practices and describes how to use `.sql` migration files.

---

## 1. Stack

| Layer      | Choice |
|-----------|--------|
| **DB**    | Neon (serverless Postgres) |
| **ORM**   | Drizzle |
| **Driver**| `@neondatabase/serverless` (HTTP adapter for Vercel/serverless) |
| **App**   | Next.js 16 (App Router) |

---

## 2. Connection (Neon + Drizzle)

- **Connection string:** `postgresql://[user]:[password]@[neon_hostname]/[dbname]?sslmode=require&channel_binding=require`
- **Env:** `DATABASE_URL` in `.env` or `.env.local` (see [NEON_SETUP.md](NEON_SETUP.md)).
- **Driver:** HTTP adapter for short-lived, stateless serverless (Vercel, Next API routes).

Current setup in `src/lib/db.ts`:

- `neon(process.env.DATABASE_URL)` from `@neondatabase/serverless`
- `drizzle(..., { schema })` from `drizzle-orm/neon-http`
- Lazy init and `getServerEnv()` so env is validated on first use.

---

## 3. Drizzle config

`drizzle.config.ts`:

- **schema:** `./src/db/schema.ts`
- **out:** `./drizzle` (migration SQL files)
- **dialect:** `postgresql`
- **dbCredentials.url:** `process.env.DATABASE_URL` (load from `.env` / `.env.local`)

---

## 4. Migrations (generating and applying .sql files)

### Generate migration SQL

After changing `src/db/schema.ts`, generate a new migration (Drizzle compares schema to DB and writes `.sql` into `./drizzle`):

```bash
npx drizzle-kit generate
# or
npm run db:generate
```

You’ll get one or more files under `drizzle/` (e.g. `0000_initial.sql`). Commit these.

### Apply migrations

Apply pending migrations to the Neon database:

```bash
npx drizzle-kit migrate
# or
npm run db:migrate
```

### Alternative: push (no .sql files)

For quick local or CI sync without migration history:

```bash
npx drizzle-kit push
# or
npm run db:push
```

`push` updates the DB to match the schema but does **not** create or run `.sql` files. Prefer `generate` + `migrate` for production and versioned schema changes.

---

## 5. Reset database (drop all tables)

To drop all tables and recreate from schema (destructive):

```bash
npm run db:drop    # DROP SCHEMA public CASCADE; CREATE SCHEMA public
npm run db:push    # Recreate tables from src/db/schema.ts
```

To reset and then use migrations instead:

```bash
npm run db:drop
npm run db:migrate # Apply all .sql in drizzle/
```

---

## 6. Schema and SQL conventions

- **Schema:** All tables live in `src/db/schema.ts` (Postgres types from `drizzle-orm/pg-core`: `pgTable`, `uuid`, `text`, `timestamp`, `numeric`, etc.).
- **Migrations:** Generated SQL lives in `drizzle/*.sql`. Do not edit by hand unless necessary; prefer changing the schema and re-running `drizzle-kit generate`.
- **Neon:** Standard Postgres; no special SQL. Use parameterized queries (Drizzle does this) and keep connections short-lived in serverless.

---

## 7. References

- **Neon + Drizzle:** Neon MCP resource `neon-drizzle` (GitHub: neondatabase-labs/ai-rules).
- **Drizzle:** [drizzle.team](https://drizzle.team) (Archon source: `drizzle.team`).
- **This repo:** [NEON_SETUP.md](NEON_SETUP.md), [DATABASE_AND_API_DESIGN.md](DATABASE_AND_API_DESIGN.md).
