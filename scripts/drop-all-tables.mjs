#!/usr/bin/env node
/**
 * Drop all tables in the public schema (CASCADE).
 * Use: node scripts/drop-all-tables.mjs
 * Requires: DATABASE_URL in .env or .env.local (same as drizzle.config).
 * WARNING: This deletes all data. Only run against a DB you intend to reset.
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

// Load .env then .env.local (same order as Next.js / drizzle)
config({ path: ".env" });
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Set it in .env or .env.local");
  process.exit(1);
}

async function main() {
  const sql = neon(DATABASE_URL);

  console.log("Dropping all tables in public schema (CASCADE)...");

  // Drop entire public schema and recreate (cleans tables, views, etc.)
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`GRANT ALL ON SCHEMA public TO public`;

  console.log("Done. Public schema is empty. Run `npx drizzle-kit push` to recreate tables from schema.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
