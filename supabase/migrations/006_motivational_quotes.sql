-- ============================================================
-- 006: Motivational quotes for onboarding and in-app placement
-- ============================================================

CREATE TABLE IF NOT EXISTS motivational_quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_text text NOT NULL,
  author text,
  placements text[] NOT NULL DEFAULT '{}'::text[],
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT motivational_quotes_non_empty_text CHECK (char_length(quote_text) > 0)
);

CREATE INDEX IF NOT EXISTS idx_motivational_quotes_active
  ON motivational_quotes(active);

CREATE INDEX IF NOT EXISTS idx_motivational_quotes_placements
  ON motivational_quotes USING gin(placements);

ALTER TABLE motivational_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read active quotes"
  ON motivational_quotes FOR SELECT
  USING (active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins read all quotes"
  ON motivational_quotes FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins insert quotes"
  ON motivational_quotes FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins update quotes"
  ON motivational_quotes FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins delete quotes"
  ON motivational_quotes FOR DELETE
  USING (is_admin(auth.uid()));

INSERT INTO motivational_quotes (quote_text, author, placements, active)
VALUES
  (
    'OUR GOALS can only be reached through a LIFE PLAN, in which we must fervently BELIEVE, upon which we must CONSISTENTLY ACT. There is NO OTHER SHORT CUT TO SUCCESS.',
    NULL,
    ARRAY['onboarding', 'planner'],
    true
  ),
  (
    'GAIN self awareness & BUILD solid foundations',
    NULL,
    ARRAY['onboarding', 'planner'],
    true
  ),
  (
    'KNOWING YOURSELF is the BEGINNING of all WISDOM.',
    'Aristotle',
    ARRAY['planner', 'onboarding'],
    true
  ),
  (
    'IF YOU ALWAYS DO WHAT YOU''VE ALWAYS DONE, YOU''LL ALWAYS BE WHERE YOU''VE ALWAYS BEEN.',
    'T.D. Jakes',
    ARRAY['planner', 'dashboard'],
    true
  ),
  (
    'The WEAK can NEVER forgive. FORGIVENESS is the ATTRIBUTE of the STRONG',
    'Mahatma Gandhi',
    ARRAY['planner'],
    true
  ),
  (
    'One of the HAPPIEST MOMENTS in life is when you find the COURAGE to LET GO of what you cannot CHANGE.',
    NULL,
    ARRAY['dashboard', 'onboarding'],
    true
  ),
  (
    'Whatever Your MIND can CONCEIVE and BELIEVE, it can ACHIEVE',
    'Napoleon Hill',
    ARRAY['dashboard', 'weekly_planner'],
    true
  ),
  (
    'This ONE STEP, CHOOSING A GOAL, and sticking to it CHANGES EVERYTHING',
    'Scott Reed',
    ARRAY['planner', 'weekly_planner'],
    true
  ),
  (
    'People with WRITTEN GOALS are 42% more likely to ACHIEVE them than the people WITHOUT WRITTEN GOALS. Telling a friend INCREASES THIS RATE to 78%.',
    NULL,
    ARRAY['dashboard', 'weekly_planner'],
    true
  ),
  (
    'LIFE only comes around ONCE, so do whatever makes you HAPPY, and be with whoever makes you SMILE :)',
    NULL,
    ARRAY['dashboard', 'onboarding'],
    true
  ),
  (
    'It does not MATTER how SLOWLY you go as long as you DO NOT STOP',
    'Confucius',
    ARRAY['weekly_planner', 'dashboard'],
    true
  ),
  (
    'BELIEVE you can and you are HALFWAY THERE',
    'Theodore Roosevelt',
    ARRAY['weekly_planner', 'dashboard'],
    true
  )
ON CONFLICT DO NOTHING;
