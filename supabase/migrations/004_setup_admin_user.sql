-- ============================================================
-- 004: Set up hr@ishir.com as admin
-- Run this LAST (after 001, 002, 003)
--
-- STEP 1: First, sign up hr@ishir.com through the app with your
--         desired password. Then come back and run this SQL.
--
-- STEP 2: Run the INSERT below. Replace the user_id if needed.
-- ============================================================

-- This finds the user by email and inserts them as admin.
-- No need to manually look up the UUID.
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT id, 'admin', id
FROM auth.users
WHERE email = 'hr@ishir.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
