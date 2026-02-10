-- ============================================================
-- 003: Soft-Delete Columns + Engagement Metrics Function
-- Run this THIRD in Supabase SQL Editor (after 001 and 002)
-- ============================================================

-- ─── Add soft-delete columns to existing tables ─────────────
ALTER TABLE planner_entries ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE weekly_plans    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE goal_scores     ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ─── Engagement metrics function (non-content, admin only) ──
CREATE OR REPLACE FUNCTION get_engagement_metrics()
RETURNS TABLE (
  user_id           uuid,
  email             text,
  steps_completed   bigint,
  weekly_plan_count bigint,
  goal_score_count  bigint,
  last_entry_at     timestamptz,
  last_weekly_plan_at timestamptz
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    u.id AS user_id,
    u.email::text,
    (SELECT COUNT(*) FROM public.planner_entries pe
     WHERE pe.user_id = u.id AND pe.deleted_at IS NULL) AS steps_completed,
    (SELECT COUNT(*) FROM public.weekly_plans wp
     WHERE wp.user_id = u.id AND wp.deleted_at IS NULL) AS weekly_plan_count,
    (SELECT COUNT(*) FROM public.goal_scores gs
     WHERE gs.user_id = u.id AND gs.deleted_at IS NULL) AS goal_score_count,
    (SELECT MAX(pe.updated_at) FROM public.planner_entries pe
     WHERE pe.user_id = u.id) AS last_entry_at,
    (SELECT MAX(wp.updated_at) FROM public.weekly_plans wp
     WHERE wp.user_id = u.id) AS last_weekly_plan_at
  FROM auth.users u
  WHERE is_admin(auth.uid());
$$;
