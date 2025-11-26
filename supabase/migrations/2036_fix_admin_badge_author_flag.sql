-- 2036_fix_admin_badge_author_flag.sql
-- Purpose: make is_admin_author viewer-independent so Admin badges show for all viewers.

SET search_path = public, extensions;

-- Redefine the view to compute admin authorship via a join, not a function call.
CREATE OR REPLACE VIEW public.catch_comments_with_admin AS
SELECT
  cc.*,
  (au.user_id IS NOT NULL) AS is_admin_author
FROM public.catch_comments cc
LEFT JOIN public.admin_users au
  ON au.user_id = cc.user_id;

-- Ensure RLS allows read access to admin_users for computing the flag.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_users'
      AND policyname = 'admin_users_select_all'
  ) THEN
    CREATE POLICY admin_users_select_all
      ON public.admin_users
      FOR SELECT
      USING (true);
  END IF;
END;
$$;
