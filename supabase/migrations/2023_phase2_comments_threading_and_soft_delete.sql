-- 2023_phase2_comments_threading_and_soft_delete.sql
-- Purpose: Phase 2A – Add soft delete column and policies for threaded comments visibility/control.

SET search_path = public, extensions;

-- Soft delete column
ALTER TABLE public.catch_comments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- SELECT: allow viewing comments on catches the user can view; hide deleted for normal users.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'catch_comments_select_viewable'
  ) THEN
    CREATE POLICY catch_comments_select_viewable ON public.catch_comments
      FOR SELECT
      USING (
        deleted_at IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.catches c
          WHERE c.id = catch_id
            AND c.deleted_at IS NULL
            AND (
              c.user_id = auth.uid() -- owner
              OR c.visibility = 'public'
              OR (
                c.visibility = 'followers'
                AND auth.uid() IS NOT NULL
                AND public.is_following(auth.uid(), c.user_id)
              )
              OR public.is_admin(auth.uid())
            )
        )
      );
  END IF;
END;
$$;

-- INSERT: allow adding comments only on catches the user can view.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'catch_comments_insert_viewable'
  ) THEN
    CREATE POLICY catch_comments_insert_viewable ON public.catch_comments
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.catches c
          WHERE c.id = catch_id
            AND c.deleted_at IS NULL
            AND (
              c.user_id = auth.uid()
              OR c.visibility = 'public'
              OR (
                c.visibility = 'followers'
                AND auth.uid() IS NOT NULL
                AND public.is_following(auth.uid(), c.user_id)
              )
              OR public.is_admin(auth.uid())
            )
        )
      );
  END IF;
END;
$$;

-- UPDATE: owner can update/soft-delete their own comments.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'catch_comments_update_owner'
  ) THEN
    CREATE POLICY catch_comments_update_owner ON public.catch_comments
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;

-- UPDATE: admin override for moderation.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'catch_comments_admin_update'
  ) THEN
    CREATE POLICY catch_comments_admin_update ON public.catch_comments
      FOR UPDATE
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END;
$$;
