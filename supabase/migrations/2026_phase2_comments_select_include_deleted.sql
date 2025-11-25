-- 2026_phase2_comments_select_include_deleted.sql
-- Purpose: Allow normal users to SELECT deleted comments (for tombstones) on catches they can view,
-- while keeping catch visibility rules intact. Admin SELECT remains via existing admin policy.

SET search_path = public, extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'catch_comments_select_viewable' AND tablename = 'catch_comments'
  ) THEN
    DROP POLICY catch_comments_select_viewable ON public.catch_comments;
  END IF;

  CREATE POLICY catch_comments_select_viewable ON public.catch_comments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.catches c
        WHERE c.id = catch_id
          AND c.deleted_at IS NULL
          AND (
            c.user_id = auth.uid() -- owner
            OR c.visibility = 'public' -- public
            OR (
              c.visibility = 'followers'
              AND auth.uid() IS NOT NULL
              AND public.is_following(auth.uid(), c.user_id)
            ) -- follower
            OR public.is_admin(auth.uid()) -- admin override
          )
      )
    );
END;
$$;

-- Note: Admin read-all for catch_comments (including deleted) is handled by catch_comments_admin_read_all
-- from 2016_phase1_admin_visibility.sql and remains unchanged.
