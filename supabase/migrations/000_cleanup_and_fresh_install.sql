-- ============================================================
-- 000: CLEANUP (run this FIRST if previous migrations failed)
-- This drops any partially created objects and starts fresh.
-- ============================================================

-- Drop policies (IF EXISTS not supported, so use DO blocks)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users read own role" ON user_roles;
  DROP POLICY IF EXISTS "Admins read all roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins insert roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins update roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins delete roles" ON user_roles;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users insert own audit" ON audit_logs;
  DROP POLICY IF EXISTS "Users read own audit" ON audit_logs;
  DROP POLICY IF EXISTS "Admins read all audit" ON audit_logs;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own consent" ON consent_records;
  DROP POLICY IF EXISTS "Users read own consent" ON consent_records;
  DROP POLICY IF EXISTS "Users insert own consent" ON consent_records;
  DROP POLICY IF EXISTS "Users update own consent" ON consent_records;
  DROP POLICY IF EXISTS "Admins read consent" ON consent_records;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users read own reminders" ON reminder_configs;
  DROP POLICY IF EXISTS "Admins manage reminders" ON reminder_configs;
  DROP POLICY IF EXISTS "Admins read reminders" ON reminder_configs;
  DROP POLICY IF EXISTS "Admins insert reminders" ON reminder_configs;
  DROP POLICY IF EXISTS "Admins update reminders" ON reminder_configs;
  DROP POLICY IF EXISTS "Admins delete reminders" ON reminder_configs;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users read own exports" ON data_exports;
  DROP POLICY IF EXISTS "Users insert own exports" ON data_exports;
  DROP POLICY IF EXISTS "Admins manage exports" ON data_exports;
  DROP POLICY IF EXISTS "Admins read exports" ON data_exports;
  DROP POLICY IF EXISTS "Admins insert exports" ON data_exports;
  DROP POLICY IF EXISTS "Admins update exports" ON data_exports;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS get_engagement_metrics();

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS data_exports CASCADE;
DROP TABLE IF EXISTS reminder_configs CASCADE;
DROP TABLE IF EXISTS consent_records CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Drop indexes (in case tables were dropped but indexes linger)
DROP INDEX IF EXISTS idx_audit_logs_actor;
DROP INDEX IF EXISTS idx_audit_logs_target;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_created;
