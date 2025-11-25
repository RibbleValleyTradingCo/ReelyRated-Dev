-- 2025_fix_catch_visibility.sql
-- Purpose: Align catch SELECT RLS with ERD (public, followers, owner, admin), keep private for owner/admin only.

SET search_path = public, extensions;

-- Drop legacy public-only select policy to replace with unified viewable policy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'catches_public_read' AND tablename = 'catches'
  ) THEN
    DROP POLICY catches_public_read ON public.catches;
  END IF;
END;
$$;

-- Add/replace viewable SELECT policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'catches_select_viewable' AND tablename = 'catches') THEN
    DROP POLICY catches_select_viewable ON public.catches;
  END IF;

  CREATE POLICY catches_select_viewable ON public.catches
    FOR SELECT
    USING (
      deleted_at IS NULL
      AND (
        user_id = auth.uid() -- owner
        OR visibility = 'public' -- public
        OR (
          visibility = 'followers'
          AND auth.uid() IS NOT NULL
          AND public.is_following(auth.uid(), user_id)
        ) -- follower
        OR public.is_admin(auth.uid()) -- admin override
      )
    );
END;
$$;

-- Admin SELECT override already provided by catches_admin_read_all in 2016_phase1_admin_visibility.sql; retained.
