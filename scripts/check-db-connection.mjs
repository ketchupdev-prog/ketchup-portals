#!/usr/bin/env node
/**
 * Verify Neon DB connection. Exits 0 on success, 1 on failure.
 * Loads .env and .env.local. Use: node scripts/check-db-connection.mjs
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env" });
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env or .env.local");
  process.exit(1);
}

async function main() {
  const sql = neon(DATABASE_URL);
  const [row] = await sql`SELECT 1 as ok`;
  if (row?.ok !== 1) throw new Error("Unexpected response");
  console.log("DB connection OK");
}

main().catch((err) => {
  console.error("DB connection failed:", err.message);
  process.exit(1);
});
