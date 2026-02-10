-- ============================================================
-- 001: RBAC Tables (user_roles, audit_logs) + Helper Functions
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- ─── user_roles (must be created BEFORE is_admin function) ──
CREATE TABLE IF NOT EXISTS user_roles (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('employee', 'admin')),
  assigned_by uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Helper function to check admin status (avoids RLS circular reference)
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin'
  );
$$;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "Users read own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all roles
CREATE POLICY "Admins read all roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert roles
CREATE POLICY "Admins insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update roles
CREATE POLICY "Admins update roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete roles
CREATE POLICY "Admins delete roles"
  ON user_roles FOR DELETE
  USING (is_admin(auth.uid()));

-- ─── audit_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id        uuid NOT NULL REFERENCES auth.users(id),
  target_user_id  uuid REFERENCES auth.users(id),
  action          text NOT NULL,
  resource        text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own audit entries
CREATE POLICY "Users insert own audit"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- Users can read audit entries where they are actor or target
CREATE POLICY "Users read own audit"
  ON audit_logs FOR SELECT
  USING (auth.uid() = actor_id OR auth.uid() = target_user_id);

-- Admins can read all audit logs
CREATE POLICY "Admins read all audit"
  ON audit_logs FOR SELECT
  USING (is_admin(auth.uid()));

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
