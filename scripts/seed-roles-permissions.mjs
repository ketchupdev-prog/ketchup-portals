/**
 * Seed roles, permissions, and role_permissions (configurable RBAC).
 * Run after migration 0005. Run: node scripts/seed-roles-permissions.mjs
 * Uses same mapping as LEGACY_ROLE_PERMISSIONS in src/lib/permissions.ts.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it in .env or .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const LEGACY_ROLE_PERMISSIONS = {
  ketchup_ops: [
    "dashboard.summary",
    "float_requests.list",
    "float_requests.approve",
    "beneficiaries.list",
    "agents.list",
    "vouchers.list",
    "audit.view",
    "admin.manage_users",
    "admin.manage_roles",
  ],
  ketchup_finance: [
    "dashboard.summary",
    "float_requests.list",
    "float_requests.approve",
    "beneficiaries.list",
    "agents.list",
    "vouchers.list",
    "audit.view",
  ],
  ketchup_compliance: [
    "dashboard.summary",
    "beneficiaries.list",
    "audit.view",
    "duplicate_redemptions.list",
    "duplicate_redemptions.resolve",
  ],
  ketchup_support: [
    "dashboard.summary",
    "beneficiaries.list",
    "agents.list",
    "float_requests.list",
  ],
  gov_manager: [
    "dashboard.summary",
    "programmes.list",
    "government.reports",
    "audit.view",
  ],
  gov_auditor: ["programmes.list", "government.reports", "audit.view"],
  agent: [
    "agent.dashboard",
    "agent.float.request",
    "agent.parcels",
    "agent.transactions",
  ],
  field_tech: ["field.tasks", "field.map", "field.assets"],
  field_lead: [
    "field.tasks",
    "field.map",
    "field.assets",
    "field.tasks.assign",
  ],
};

const ROLE_NAMES = {
  ketchup_ops: "Ketchup Ops",
  ketchup_finance: "Ketchup Finance",
  ketchup_compliance: "Ketchup Compliance",
  ketchup_support: "Ketchup Support",
  gov_manager: "Government Manager",
  gov_auditor: "Government Auditor",
  agent: "Agent",
  field_tech: "Field Technician",
  field_lead: "Field Lead",
};

function slugToResourceAction(slug) {
  const i = slug.lastIndexOf(".");
  if (i === -1) return { resource: slug, action: "view" };
  return { resource: slug.slice(0, i), action: slug.slice(i + 1) };
}

function slugToName(slug) {
  const [res, act] = slug.split(".");
  const r = (res || "").replace(/_/g, " ");
  const a = (act || "view").replace(/_/g, " ");
  return `${r.charAt(0).toUpperCase() + r.slice(1)} ${a}`;
}

async function run() {
  console.log("Seeding roles and permissions...");

  const allSlugs = [
    ...new Set(Object.values(LEGACY_ROLE_PERMISSIONS).flat()),
  ].sort();

  const permRows = await sql`SELECT id, slug FROM permissions`;
  const permBySlug = Object.fromEntries(permRows.map((p) => [p.slug, p.id]));

  for (const slug of allSlugs) {
    if (permBySlug[slug]) continue;
    const { resource, action } = slugToResourceAction(slug);
    const name = slugToName(slug);
    const id = randomUUID();
    await sql`
      INSERT INTO permissions (id, slug, name, resource, action, description)
      VALUES (${id}, ${slug}, ${name}, ${resource}, ${action}, ${"Permission: " + slug})
    `;
    permBySlug[slug] = id;
  }

  const roleRows = await sql`SELECT id, slug FROM roles`;
  const roleBySlug = Object.fromEntries(roleRows.map((r) => [r.slug, r.id]));

  for (const [slug, name] of Object.entries(ROLE_NAMES)) {
    if (roleBySlug[slug]) continue;
    const id = randomUUID();
    await sql`
      INSERT INTO roles (id, name, slug, description)
      VALUES (${id}, ${name}, ${slug}, ${"Role: " + name})
    `;
    roleBySlug[slug] = id;
  }

  for (const [roleSlug, permissionSlugs] of Object.entries(
    LEGACY_ROLE_PERMISSIONS
  )) {
    const roleId = roleBySlug[roleSlug];
    if (!roleId) continue;
    const existing = await sql`
      SELECT permission_id FROM role_permissions WHERE role_id = ${roleId}
    `;
    const existingSet = new Set(existing.map((r) => r.permission_id));
    for (const pSlug of permissionSlugs) {
      const permId = permBySlug[pSlug];
      if (!permId || existingSet.has(permId)) continue;
      await sql`
        INSERT INTO role_permissions (id, role_id, permission_id)
        VALUES (${randomUUID()}, ${roleId}, ${permId})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `;
      existingSet.add(permId);
    }
  }

  // Link existing portal_users to role_id by matching role (text) to roles.slug
  const users = await sql`SELECT id, role FROM portal_users WHERE role_id IS NULL`;
  for (const u of users) {
    const roleId = roleBySlug[u.role];
    if (roleId) {
      await sql`
        UPDATE portal_users SET role_id = ${roleId} WHERE id = ${u.id}
      `;
    }
  }

  console.log("Roles and permissions seed complete.");
}

export { run };

const isMain = process.argv[1] && process.argv[1].endsWith("seed-roles-permissions.mjs");
if (isMain) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
