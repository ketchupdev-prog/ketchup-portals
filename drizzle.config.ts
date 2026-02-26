/**
 * Drizzle Kit config for Neon PostgreSQL.
 * Run: npx drizzle-kit generate (then migrate) or npx drizzle-kit push
 * Loads .env.local so DATABASE_URL is available without exporting.
 */

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
