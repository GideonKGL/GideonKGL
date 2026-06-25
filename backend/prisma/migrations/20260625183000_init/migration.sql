CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "DevicePlatform" AS ENUM ('ANDROID', 'IOS', 'WEB', 'DESKTOP');
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');
CREATE TYPE "NotificationType" AS ENUM ('SOS', 'LOCATION', 'SYSTEM', 'SECURITY');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(320) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "pin_hash" TEXT,
  "first_name" VARCHAR(120) NOT NULL,
  "last_name" VARCHAR(120) NOT NULL,
  "phone" VARCHAR(40),
  "avatar_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "password_reset_token" TEXT,
  "password_reset_expiry" TIMESTAMPTZ,
  "last_login_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(80) NOT NULL UNIQUE,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "permissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(120) NOT NULL UNIQUE,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "role_permissions" (
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "devices" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" VARCHAR(160) NOT NULL,
  "platform" "DevicePlatform" NOT NULL,
  "device_uid" VARCHAR(180) NOT NULL UNIQUE,
  "fcm_token" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "last_seen_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "locations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "device_id" UUID NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
  "latitude" DECIMAL(10, 7) NOT NULL,
  "longitude" DECIMAL(10, 7) NOT NULL,
  "accuracy" DECIMAL(8, 2),
  "speed" DECIMAL(8, 2),
  "heading" DECIMAL(8, 2),
  "altitude" DECIMAL(10, 2),
  "battery" INTEGER,
  "recorded_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "emergency_alerts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "device_id" UUID NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
  "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
  "latitude" DECIMAL(10, 7) NOT NULL,
  "longitude" DECIMAL(10, 7) NOT NULL,
  "message" TEXT,
  "acknowledged_by" UUID,
  "acknowledged_at" TIMESTAMPTZ,
  "resolved_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "action" VARCHAR(160) NOT NULL,
  "entity" VARCHAR(120) NOT NULL,
  "entity_id" UUID,
  "metadata" JSONB,
  "ip_address" VARCHAR(64),
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "devices_user_id_idx" ON "devices"("user_id");
CREATE INDEX "devices_is_active_idx" ON "devices"("is_active");
CREATE INDEX "locations_device_recorded_idx" ON "locations"("device_id", "recorded_at" DESC);
CREATE INDEX "locations_recorded_at_idx" ON "locations"("recorded_at");
CREATE INDEX "emergency_alerts_status_created_idx" ON "emergency_alerts"("status", "created_at" DESC);
CREATE INDEX "emergency_alerts_user_id_idx" ON "emergency_alerts"("user_id");
CREATE INDEX "notifications_user_read_idx" ON "notifications"("user_id", "read_at");
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs"("actor_id", "created_at" DESC);
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity", "entity_id");

INSERT INTO "roles" ("name", "description") VALUES
  ('SUPER_ADMIN', 'Full platform administration'),
  ('ADMIN', 'Operational administration'),
  ('DISPATCHER', 'Monitoring and dispatch operations'),
  ('RESPONDER', 'Emergency response operations'),
  ('USER', 'Mobile application user');

INSERT INTO "permissions" ("key", "description") VALUES
  ('users:read', 'Read users'),
  ('users:write', 'Manage users'),
  ('devices:read', 'Read devices'),
  ('devices:write', 'Manage devices'),
  ('locations:read', 'Read location data'),
  ('locations:write', 'Create location data'),
  ('alerts:read', 'Read emergency alerts'),
  ('alerts:write', 'Manage emergency alerts'),
  ('notifications:write', 'Send notifications'),
  ('reports:read', 'Read reports'),
  ('audit:read', 'Read audit logs');
