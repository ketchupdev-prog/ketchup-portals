/**
 * Ketchup SmartPay – Drizzle schema for Neon PostgreSQL
 * Matches docs/DATABASE_AND_API_DESIGN.md (Database & API Design).
 * Location: src/db/schema.ts
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  boolean,
  integer,
  jsonb,
  numeric,
  inet,
  unique,
} from "drizzle-orm/pg-core";

// ─── Core (shared with beneficiary platform) ─────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(),
  fullName: text("full_name").notNull(),
  idNumber: text("id_number"),
  dateOfBirth: date("date_of_birth"),
  region: text("region"),
  walletStatus: text("wallet_status").notNull().default("active"), // active | frozen | suspended
  proofOfLifeDueDate: timestamp("proof_of_life_due_date", { withTimezone: true }),
  smsOptOut: boolean("sms_opt_out").default(false),
  emailOptOut: boolean("email_opt_out").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const programmes = pgTable("programmes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  allocatedBudget: numeric("allocated_budget", { precision: 14, scale: 2 }),
  spentToDate: numeric("spent_to_date", { precision: 14, scale: 2 }).default("0"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  verificationFrequencyDays: integer("verification_frequency_days").default(90),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("NAD"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vouchers = pgTable("vouchers", {
  id: uuid("id").primaryKey().defaultRandom(),
  beneficiaryId: uuid("beneficiary_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  programmeId: uuid("programme_id")
    .notNull()
    .references(() => programmes.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull(), // available | redeemed | expired
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  expiryDate: date("expiry_date").notNull(),
  loanDeduction: numeric("loan_deduction", { precision: 14, scale: 2 }),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // credit | debit
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Agents (referenced by portal_users, transactions, etc.)
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  locationLat: numeric("location_lat", { precision: 10, scale: 8 }),
  locationLng: numeric("location_lng", { precision: 11, scale: 8 }),
  address: text("address"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }), // decimal % e.g. 0.5 = 0.5%, 2.25 = 2.25%
  floatBalance: numeric("float_balance", { precision: 14, scale: 2 }).default("0"),
  status: text("status").notNull().default("active"), // active | suspended
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  beneficiaryId: uuid("beneficiary_id")
    .notNull()
    .references(() => users.id),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id),
  type: text("type").notNull(), // cashout | billpay | airtime
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 14, scale: 2 }),
  method: text("method"), // cash | QR | code
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

// Portal users (referenced by audit_logs, float_requests, maintenance_logs, tasks, proof_of_life_events)
// role: legacy text (ketchup_ops, agent, etc.). When role_id is set, permissions come from that role; else from role text.
export const portalUsers = pgTable("portal_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // legacy: ketchup_ops | ketchup_compliance | ... | agent | field_tech | field_lead
  roleId: uuid("role_id").references((): any => roles.id), // optional FK; when set, permissions from roles/permissions
  agentId: uuid("agent_id").references(() => agents.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  phone: text("phone"),
});

export const proofOfLifeEvents = pgTable("proof_of_life_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  method: text("method").notNull(), // app | agent | ussd
  performedBy: uuid("performed_by").references(() => portalUsers.id),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  beneficiaryId: uuid("beneficiary_id")
    .notNull()
    .references(() => users.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  outstanding: numeric("outstanding", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull(), // active | repaid | defaulted
});

// ─── Portal-specific ───────────────────────────────────────────────────────

/** Configurable roles (admin-managed). Permissions attached via role_permissions. */
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // e.g. ketchup_ops, agent, gov_manager
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Permissions (admin-managed). Resource.action e.g. float_requests.list, admin.manage_users. */
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Which permissions each role has. Admins can change this. */
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.roleId, t.permissionId)]);

// NOTE: portal_users is defined once above (~line 118). Do not add a second definition here.
export const agentFloatTransactions = pgTable("agent_float_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  type: text("type").notNull(), // top_up | settlement | adjustment
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const floatRequests = pgTable("float_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending | approved_pending_second | approved | rejected
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  requestedBy: uuid("requested_by").references(() => portalUsers.id),
  reviewedBy: uuid("reviewed_by").references(() => portalUsers.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  firstReviewedBy: uuid("first_reviewed_by").references(() => portalUsers.id),
  firstReviewedAt: timestamp("first_reviewed_at", { withTimezone: true }),
});

export const posTerminals = pgTable("pos_terminals", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: text("device_id").notNull().unique(),
  model: text("model"),
  status: text("status").notNull().default("active"), // active | maintenance | offline
  assignedAgentId: uuid("assigned_agent_id").references(() => agents.id),
  lastPing: timestamp("last_ping", { withTimezone: true }),
  softwareVersion: text("software_version"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // mobile_unit | atm | warehouse
  name: text("name").notNull(),
  locationLat: numeric("location_lat", { precision: 10, scale: 8 }),
  locationLng: numeric("location_lng", { precision: 11, scale: 8 }),
  status: text("status").notNull().default("active"), // active | maintenance | offline
  cashLevel: numeric("cash_level", { precision: 14, scale: 2 }),
  lastReplenishment: timestamp("last_replenishment", { withTimezone: true }),
  driver: text("driver"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assetLocations = pgTable("asset_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id),
  lat: numeric("lat", { precision: 10, scale: 8 }).notNull(),
  lng: numeric("lng", { precision: 11, scale: 8 }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const maintenanceLogs = pgTable("maintenance_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id),
  technicianId: uuid("technician_id").references(() => portalUsers.id),
  type: text("type").notNull(), // inspection | repair | service | replenish
  notes: text("notes"),
  cashBefore: numeric("cash_before", { precision: 14, scale: 2 }),
  cashAdded: numeric("cash_added", { precision: 14, scale: 2 }),
  cashAfter: numeric("cash_after", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  assetId: uuid("asset_id").references(() => assets.id),
  assignedTo: uuid("assigned_to").references(() => portalUsers.id),
  dueDate: date("due_date"),
  status: text("status").notNull().default("pending"), // pending | in_progress | done
  createdBy: uuid("created_by").references(() => portalUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const parcels = pgTable("parcels", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackingCode: text("tracking_code").notNull().unique(),
  recipientName: text("recipient_name").notNull(),
  recipientPhone: text("recipient_phone"),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id),
  status: text("status").notNull(), // in_transit | ready | collected | returned
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => portalUsers.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"), // open | investigating | resolved
  severity: text("severity"), // low | medium | high | critical
  reportedBy: uuid("reported_by").references(() => portalUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  loginAt: timestamp("login_at", { withTimezone: true }).notNull().defaultNow(),
  logoutAt: timestamp("logout_at", { withTimezone: true }),
  deviceOs: text("device_os"),
  appVersion: text("app_version"),
});

export const ussdSessions = pgTable("ussd_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  sessionData: jsonb("session_data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// SMS queue: pending → sent → delivered (or failed). Processed by cron/worker.
export const smsQueue = pgTable("sms_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientPhone: text("recipient_phone").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending | sent | failed | delivered
  providerMessageId: text("provider_message_id"),
  referenceId: uuid("reference_id"),
  referenceType: text("reference_type"), // beneficiary | voucher | agent | field_task
  attempts: integer("attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  errorMessage: text("error_message"),
});

// In-app notifications (PRD §7.4) – shown in header notification center.
export const inAppNotifications = pgTable("in_app_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => portalUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Push subscriptions (PRD §7.4.1) – for beneficiaries/field ops push notifications.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  portalUserId: uuid("portal_user_id").references(() => portalUsers.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Portal user preferences (notification_preferences etc.) – Profile & Settings spec.
// preference_value: JSONB for efficient JSON ops; stores e.g. { agent_low_float: { in_app: true, email: false, sms: true } }
export const portalUserPreferences = pgTable(
  "portal_user_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portalUserId: uuid("portal_user_id")
      .notNull()
      .references(() => portalUsers.id, { onDelete: "cascade" }),
    preferenceKey: text("preference_key").notNull().default("notification_preferences"),
    preferenceValue: jsonb("preference_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.portalUserId, t.preferenceKey)]
);

// ─── Offline Redemption Integrity & Advance Recovery (PRD §3.3.11) ───────────

/**
 * Tracks vouchers that were redeemed more than once due to offline/sync conditions.
 * The first confirmed redemption is canonical; subsequent ones become duplicate events.
 * status: advance_posted | under_review | no_financial_impact | agent_appealing | resolved
 */
export const duplicateRedemptionEvents = pgTable("duplicate_redemption_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  voucherId: uuid("voucher_id")
    .notNull()
    .references(() => vouchers.id),
  beneficiaryId: uuid("beneficiary_id")
    .notNull()
    .references(() => users.id),
  // Text ref so we can link back to the redemption event even if stored elsewhere
  canonicalRedemptionRef: text("canonical_redemption_ref").notNull(),
  // Idempotency key submitted by the duplicate device
  duplicateAttemptId: text("duplicate_attempt_id").notNull(),
  duplicateAgentId: uuid("duplicate_agent_id").references(() => agents.id),
  duplicateDeviceId: text("duplicate_device_id"),
  duplicateAmount: numeric("duplicate_amount", { precision: 14, scale: 2 }).notNull(),
  // Device clock at the time of the duplicate attempt
  duplicateRequestedAt: timestamp("duplicate_requested_at", { withTimezone: true }).notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("advance_posted"),
  resolutionNotes: text("resolution_notes"),
  appealEvidenceUrl: text("appeal_evidence_url"), // URL to stored evidence (e.g. Supabase Storage) for agent appeal
  resolvedBy: uuid("resolved_by").references(() => portalUsers.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

/**
 * Ledger of over-disbursements (advances) owed back by beneficiaries.
 * Each row represents money that was over-dispensed due to a duplicate redemption.
 * Recovered incrementally each payment cycle until fully paid back.
 * status: outstanding | fully_recovered | escalated
 */
export const beneficiaryAdvances = pgTable("beneficiary_advances", {
  id: uuid("id").primaryKey().defaultRandom(),
  beneficiaryId: uuid("beneficiary_id")
    .notNull()
    .references(() => users.id),
  sourceEventId: uuid("source_event_id")
    .notNull()
    .references(() => duplicateRedemptionEvents.id),
  programmeId: uuid("programme_id").references(() => programmes.id),
  originalAmount: numeric("original_amount", { precision: 14, scale: 2 }).notNull(),
  recoveredAmount: numeric("recovered_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  // How many disbursement cycles have elapsed without full recovery
  cyclesOutstanding: integer("cycles_outstanding").notNull().default(0),
  status: text("status").notNull().default("outstanding"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastRecoveryAt: timestamp("last_recovery_at", { withTimezone: true }),
});

/**
 * One row per payment-cycle deduction used to recover an advance.
 * Records the original entitlement, how much was deducted, and what the beneficiary
 * actually received (net_disbursed = entitlement - amount_deducted).
 */
export const advanceRecoveryTransactions = pgTable("advance_recovery_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  advanceId: uuid("advance_id")
    .notNull()
    .references(() => beneficiaryAdvances.id),
  // Nullable: the voucher issued this cycle after the deduction
  voucherId: uuid("voucher_id").references(() => vouchers.id),
  cycleDate: date("cycle_date").notNull(),
  amountDeducted: numeric("amount_deducted", { precision: 14, scale: 2 }).notNull(),
  entitlement: numeric("entitlement", { precision: 14, scale: 2 }).notNull(),
  netDisbursed: numeric("net_disbursed", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
