/**
 * Seed script for local/test DB (PRD Audit Finding 10.2, WHATS_LEFT §4).
 * Inserts minimal data: one portal_user per role, agents, float_requests (pending/approved/rejected),
 * duplicate_redemption_events in each status, beneficiary_advances.
 * Run: node scripts/seed-portal.mjs (requires DATABASE_URL in .env)
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it in .env or .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const BCRYPT_ROUNDS = 10;
const TEST_PASSWORD = "TestPassword1!";

async function run() {
  console.log("Seeding portal test data...");

  // Seed roles and permissions first (configurable RBAC)
  try {
    const { run: seedRoles } = await import("./seed-roles-permissions.mjs");
    await seedRoles();
  } catch (e) {
    console.warn("seed-roles-permissions skipped or failed (run migration 0005 first):", e.message);
  }

  const existingUser = await sql`SELECT id FROM users LIMIT 1`;
  let beneficiaryId = existingUser[0]?.id;
  if (!beneficiaryId) {
    await sql`
      INSERT INTO users (id, phone, full_name, wallet_status)
      VALUES (gen_random_uuid(), '+264811111111', 'Test Beneficiary', 'active')
      ON CONFLICT (phone) DO NOTHING
    `;
    const u = await sql`SELECT id FROM users WHERE phone = '+264811111111' LIMIT 1`;
    beneficiaryId = u[0]?.id;
  } else {
    beneficiaryId = existingUser[0].id;
  }

  const prog = await sql`SELECT id FROM programmes LIMIT 1`;
  let programmeId = prog[0]?.id;
  if (!programmeId && beneficiaryId) {
    programmeId = randomUUID();
    await sql`INSERT INTO programmes (id, name, start_date, end_date) VALUES (${programmeId}, 'Test Programme', '2025-01-01', '2026-12-31')`;
  } else if (prog[0]) programmeId = prog[0].id;

  const agentsExist = await sql`SELECT id FROM agents LIMIT 1`;
  let agentId = agentsExist[0]?.id;
  if (!agentId) {
    agentId = randomUUID();
    await sql`INSERT INTO agents (id, name, status, float_balance) VALUES (${agentId}, 'Test Agent', 'active', 1000)`;
  } else agentId = agentsExist[0].id;

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_ROUNDS);
  const roleSlugs = ["ketchup_ops", "ketchup_finance", "ketchup_compliance", "gov_manager", "agent", "field_tech", "field_lead"];
  const roleRows = await sql`SELECT id, slug FROM roles`;
  const roleIdBySlug = Object.fromEntries(roleRows.map((r) => [r.slug, r.id]));
  const portalUserIds = {};

  for (const role of roleSlugs) {
    const email = `seed-${role}@test.ketchup.local`;
    const existing = await sql`SELECT id FROM portal_users WHERE email = ${email} LIMIT 1`;
    if (existing[0]) { portalUserIds[role] = existing[0].id; continue; }
    const id = randomUUID();
    const roleId = roleIdBySlug[role] ?? null;
    await sql`INSERT INTO portal_users (id, email, password_hash, full_name, role, role_id, agent_id) VALUES (${id}, ${email}, ${passwordHash}, ${"Seed " + role}, ${role}, ${roleId}, ${role === "agent" ? agentId : null})`;
    portalUserIds[role] = id;
  }

  if ((await sql`SELECT id FROM float_requests WHERE status = 'pending' LIMIT 1`).length === 0)
    await sql`INSERT INTO float_requests (id, agent_id, amount, status, requested_by) VALUES (gen_random_uuid(), ${agentId}, 500, 'pending', ${portalUserIds.agent ?? null})`;
  if ((await sql`SELECT id FROM float_requests WHERE status = 'approved' LIMIT 1`).length === 0)
    await sql`INSERT INTO float_requests (id, agent_id, amount, status, reviewed_by, reviewed_at, requested_by) VALUES (gen_random_uuid(), ${agentId}, 200, 'approved', ${portalUserIds.ketchup_finance ?? null}, now(), ${portalUserIds.agent ?? null})`;
  if ((await sql`SELECT id FROM float_requests WHERE status = 'rejected' LIMIT 1`).length === 0)
    await sql`INSERT INTO float_requests (id, agent_id, amount, status, reviewed_by, reviewed_at, requested_by) VALUES (gen_random_uuid(), ${agentId}, 100, 'rejected', ${portalUserIds.ketchup_ops ?? null}, now(), ${portalUserIds.agent ?? null})`;

  const v = await sql`SELECT id FROM vouchers LIMIT 1`;
  let voucherId = v[0]?.id;
  if (!voucherId && beneficiaryId && programmeId) {
    voucherId = randomUUID();
    await sql`INSERT INTO vouchers (id, beneficiary_id, programme_id, amount, status, expiry_date) VALUES (${voucherId}, ${beneficiaryId}, ${programmeId}, 500, 'redeemed', '2026-12-31')`;
  } else if (v[0]) voucherId = v[0].id;

  const statuses = ["advance_posted", "under_review", "no_financial_impact", "agent_appealing", "resolved"];
  for (const st of statuses) {
    if ((await sql`SELECT id FROM duplicate_redemption_events WHERE status = ${st} LIMIT 1`).length > 0) continue;
    if (!voucherId || !beneficiaryId) continue;
    const eventId = randomUUID();
    await sql`INSERT INTO duplicate_redemption_events (id, voucher_id, beneficiary_id, canonical_redemption_ref, duplicate_attempt_id, duplicate_amount, duplicate_requested_at, detected_at, status) VALUES (${eventId}, ${voucherId}, ${beneficiaryId}, ${randomUUID()}, ${"dup-" + st + "-" + Date.now()}, 500, now(), now(), ${st})`;
    if (st === "advance_posted" && programmeId && (await sql`SELECT id FROM beneficiary_advances LIMIT 1`).length === 0)
      await sql`INSERT INTO beneficiary_advances (id, beneficiary_id, source_event_id, programme_id, original_amount, recovered_amount, status) VALUES (gen_random_uuid(), ${beneficiaryId}, ${eventId}, ${programmeId}, 500, 0, 'outstanding')`;
  }

  console.log("Seed complete. Portal logins (password: " + TEST_PASSWORD + "):");
  roleSlugs.forEach((r) => console.log("  seed-" + r + "@test.ketchup.local"));
}

run().catch((err) => { console.error(err); process.exit(1); });
