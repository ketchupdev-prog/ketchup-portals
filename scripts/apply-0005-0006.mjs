#!/usr/bin/env node
/**
 * Apply migrations 0004, 0005, 0006 manually (e.g. if drizzle journal is ahead of DB state).
 * Run: node scripts/apply-0005-0006.mjs
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required (.env or .env.local)");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runRaw(statement) {
  const s = statement.trim();
  if (!s) return;
  await sql`${sql.unsafe(s)}`;
}

async function main() {
  console.log("Applying 0004_audit_prd_float_preferences_indexes.sql...");
  const content4 = readFileSync(join(root, "drizzle/0004_audit_prd_float_preferences_indexes.sql"), "utf8");
  const stmts4 = content4
    .split(/\n(?=ALTER|CREATE|DO \$\$)/)
    .map((s) => s.replace(/^--.*$/gm, "").trim())
    .filter((s) => s.length > 0);
  for (const st of stmts4) {
    if (st.startsWith("DO $$")) {
      const end = st.indexOf("END $$;");
      const block = end > 0 ? st.slice(0, end + 7) : st;
      await runRaw(block);
    } else {
      await runRaw(st.endsWith(";") ? st : st + ";");
    }
  }
  console.log("0004 applied.");
  const stmts5 = [
    `CREATE TABLE IF NOT EXISTS "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
    `CREATE TABLE IF NOT EXISTS "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "resource" text NOT NULL,
  "action" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
    `CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE("role_id", "permission_id")
)`,
    `ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "role_id" uuid REFERENCES "roles"("id")`,
    `CREATE INDEX IF NOT EXISTS "role_permissions_role_id_idx" ON "role_permissions" ("role_id")`,
    `CREATE INDEX IF NOT EXISTS "role_permissions_permission_id_idx" ON "role_permissions" ("permission_id")`,
    `CREATE INDEX IF NOT EXISTS "portal_users_role_id_idx" ON "portal_users" ("role_id")`,
  ];
  for (const st of stmts5) {
    await runRaw(st + ";");
  }
  console.log("0005 applied.");

  console.log("Applying 0006_canonical_redemption_ref.sql...");
  const content6 = readFileSync(join(root, "drizzle/0006_canonical_redemption_ref.sql"), "utf8");
  const block = content6.replace(/^--.*$/gm, "").trim();
  await runRaw(block);
  console.log("0006 applied.");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
