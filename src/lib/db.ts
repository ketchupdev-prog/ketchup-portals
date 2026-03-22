/**
 * Ketchup SmartPay – Neon PostgreSQL + Drizzle ORM
 * Serverless-safe for Vercel. Use DATABASE_URL in .env.local / Vercel env.
 * Lazy init so build/static collection does not require DATABASE_URL.
 * Env validation (getServerEnv) runs on first DB access – fail-fast if DATABASE_URL missing.
 *
 * Vitest: uses `pg` + drizzle/node-postgres so tests use the Postgres TLS stack instead of
 * fetch/undici (avoids UNABLE_TO_GET_ISSUER_CERT_LOCALLY with neon-http on some macOS/Node setups).
 * Production / Next still uses @neondatabase/serverless (HTTP) for serverless-friendly pooling.
 * Location: src/lib/db.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";

type DbInstance = ReturnType<typeof drizzleNeonHttp<typeof schema>>;

let _db: DbInstance | null = null;
let _testPool: Pool | null = null;

/** `pg` SSL: Neon/cloud needs TLS; local Postgres in .env.test often has no SSL. */
function pgSslOption(connectionString: string): boolean | { rejectUnauthorized: boolean } {
  const lower = connectionString.toLowerCase();
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) {
    return false;
  }
  if (lower.includes("sslmode=disable")) {
    return false;
  }
  return { rejectUnauthorized: true };
}

function getDbInstance(): DbInstance {
  const env = getServerEnv();

  if (process.env.VITEST === "true") {
    if (!_testPool) {
      _testPool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: pgSslOption(env.DATABASE_URL),
        max: 5,
      });
    }
    return drizzleNodePg(_testPool, { schema }) as unknown as DbInstance;
  }

  const sql = neon(env.DATABASE_URL);
  return drizzleNeonHttp(sql, { schema });
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    if (!_db) _db = getDbInstance();
    return Reflect.get(_db, prop);
  },
});
