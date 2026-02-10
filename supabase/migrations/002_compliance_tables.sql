-- ============================================================
-- 002: Compliance Tables (consent, reminders, data_exports)
-- Run this SECOND in Supabase SQL Editor (after 001)
-- ============================================================

-- ─── consent_records ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_records (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type  text NOT NULL,
  granted       boolean NOT NULL DEFAULT false,
  granted_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, consent_type)
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Users can read their own consent
CREATE POLICY "Users read own consent"
  ON consent_records FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consent
CREATE POLICY "Users insert own consent"
  ON consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own consent
CREATE POLICY "Users update own consent"
  ON consent_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all consent records
CREATE POLICY "Admins read consent"
  ON consent_records FOR SELECT
  USING (is_admin(auth.uid()));

-- ─── reminder_configs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminder_configs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  configured_by   uuid NOT NULL REFERENCES auth.users(id),
  frequency       text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'none')),
  day_of_week     int,
  time_of_day     time DEFAULT '09:00',
  active          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(target_user_id)
);

ALTER TABLE reminder_configs ENABLE ROW LEVEL SECURITY;

-- Employees can read their own reminder config
CREATE POLICY "Users read own reminders"
  ON reminder_configs FOR SELECT
  USING (auth.uid() = target_user_id);

-- Admins can read all reminder configs
CREATE POLICY "Admins read reminders"
  ON reminder_configs FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert reminder configs
CREATE POLICY "Admins insert reminders"
  ON reminder_configs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update reminder configs
CREATE POLICY "Admins update reminders"
  ON reminder_configs FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete reminder configs
CREATE POLICY "Admins delete reminders"
  ON reminder_configs FOR DELETE
  USING (is_admin(auth.uid()));

-- ─── data_exports ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_exports (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  requested_by  uuid NOT NULL REFERENCES auth.users(id),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  export_type   text NOT NULL DEFAULT 'pdf',
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);

ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- Users can see their own exports
CREATE POLICY "Users read own exports"
  ON data_exports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can request their own export
CREATE POLICY "Users insert own exports"
  ON data_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = requested_by);

-- Admins can read all exports
CREATE POLICY "Admins read exports"
  ON data_exports FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert exports on behalf
CREATE POLICY "Admins insert exports"
  ON data_exports FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update export status
CREATE POLICY "Admins update exports"
  ON data_exports FOR UPDATE
  USING (is_admin(auth.uid()));
