CREATE TABLE "agent_float_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"type" text NOT NULL,
	"reference" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location_lat" numeric(10, 8),
	"location_lng" numeric(11, 8),
	"address" text,
	"contact_phone" text,
	"contact_email" text,
	"commission_rate" numeric(5, 2),
	"float_balance" numeric(14, 2) DEFAULT '0',
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"lat" numeric(10, 8) NOT NULL,
	"lng" numeric(11, 8) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"location_lat" numeric(10, 8),
	"location_lng" numeric(11, 8),
	"status" text DEFAULT 'active' NOT NULL,
	"cash_level" numeric(14, 2),
	"last_replenishment" timestamp with time zone,
	"driver" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "float_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"severity" text,
	"reported_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"outstanding" numeric(14, 2) NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"technician_id" uuid,
	"type" text NOT NULL,
	"notes" text,
	"cash_before" numeric(14, 2),
	"cash_added" numeric(14, 2),
	"cash_after" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_code" text NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_phone" text,
	"agent_id" uuid NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"collected_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	CONSTRAINT "parcels_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
CREATE TABLE "portal_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text NOT NULL,
	"agent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login" timestamp with time zone,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" text,
	CONSTRAINT "portal_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pos_terminals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" text NOT NULL,
	"model" text,
	"status" text DEFAULT 'active' NOT NULL,
	"assigned_agent_id" uuid,
	"last_ping" timestamp with time zone,
	"software_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pos_terminals_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "programmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"allocated_budget" numeric(14, 2),
	"spent_to_date" numeric(14, 2) DEFAULT '0',
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"verification_frequency_days" integer DEFAULT 90
);
--> statement-breakpoint
CREATE TABLE "proof_of_life_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"method" text NOT NULL,
	"performed_by" uuid,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_phone" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"reference_id" uuid,
	"reference_type" text,
	"attempts" integer DEFAULT 0,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"asset_id" uuid,
	"assigned_to" uuid,
	"due_date" date,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"fee" numeric(14, 2),
	"method" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"login_at" timestamp with time zone DEFAULT now() NOT NULL,
	"logout_at" timestamp with time zone,
	"device_os" text,
	"app_version" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"full_name" text NOT NULL,
	"id_number" text,
	"date_of_birth" date,
	"region" text,
	"wallet_status" text DEFAULT 'active' NOT NULL,
	"proof_of_life_due_date" timestamp with time zone,
	"sms_opt_out" boolean DEFAULT false,
	"email_opt_out" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "ussd_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"programme_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"redeemed_at" timestamp with time zone,
	"expiry_date" date NOT NULL,
	"loan_deduction" numeric(14, 2)
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'NAD' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_float_transactions" ADD CONSTRAINT "agent_float_transactions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_locations" ADD CONSTRAINT "asset_locations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_portal_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_requests" ADD CONSTRAINT "float_requests_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_requests" ADD CONSTRAINT "float_requests_reviewed_by_portal_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reported_by_portal_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_beneficiary_id_users_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_technician_id_portal_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_users" ADD CONSTRAINT "portal_users_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_assigned_agent_id_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_of_life_events" ADD CONSTRAINT "proof_of_life_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_of_life_events" ADD CONSTRAINT "proof_of_life_events_performed_by_portal_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_portal_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_portal_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_beneficiary_id_users_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ussd_sessions" ADD CONSTRAINT "ussd_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_beneficiary_id_users_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;