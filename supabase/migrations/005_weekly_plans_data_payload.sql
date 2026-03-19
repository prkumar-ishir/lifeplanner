-- ============================================================
-- 005: Weekly planner structured payload
-- Adds a JSON payload for the richer weekly planner board.
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_plans (
  id             text NOT NULL,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year           integer NOT NULL,
  month          integer NOT NULL,
  week_of_month  integer NOT NULL,
  focus          text DEFAULT '',
  wins           text[] DEFAULT '{}',
  schedule_notes text DEFAULT '',
  data           jsonb DEFAULT '{}'::jsonb,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  deleted_at     timestamptz,
  UNIQUE(user_id, id)
);

ALTER TABLE weekly_plans
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;
