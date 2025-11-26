-- 2034_phase2_comments_select_include_deleted.sql
-- (Moved from 2026_phase2_comments_select_include_deleted.sql to resolve duplicate version)

SET search_path = public, extensions;

-- Ensure catch_comments SELECT policy includes deleted rows for admins while normal users see only non-deleted.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catch_comments'
      AND policyname = 'catch_comments_select_viewable'
  ) THEN
    DROP POLICY catch_comments_select_viewable ON public.catch_comments;
  END IF;

  CREATE POLICY catch_comments_select_viewable
    ON public.catch_comments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.catches c
        WHERE c.id = catch_id
          AND c.deleted_at IS NULL
          AND (
            c.user_id = auth.uid()
            OR c.visibility = 'public'
            OR (c.visibility = 'followers' AND auth.uid() IS NOT NULL AND public.is_following(auth.uid(), c.user_id))
            OR public.is_admin(auth.uid())
          )
      )
      AND (deleted_at IS NULL OR public.is_admin(auth.uid()))
    );
END;
$$;
