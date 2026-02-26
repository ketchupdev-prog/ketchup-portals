/**
 * Ketchup SmartPay – Neon PostgreSQL + Drizzle ORM
 * Serverless-safe for Vercel. Use DATABASE_URL in .env.local / Vercel env.
 * Lazy init so build/static collection does not require DATABASE_URL.
 * Env validation (getServerEnv) runs on first DB access – fail-fast if DATABASE_URL missing.
 * Location: src/lib/db.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDbInstance() {
  const env = getServerEnv();
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema });
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    if (!_db) _db = getDbInstance();
    return Reflect.get(_db, prop);
  },
});
