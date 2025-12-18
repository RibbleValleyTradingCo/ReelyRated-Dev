-- 2115: Harden writes to catch_reactions and ratings to enforce visibility/block rules.

SET search_path = public, extensions;

-- RESTRICTIVE policies for catch_reactions writes (INSERT, UPDATE).
-- Deletes remain governed by existing owner policies (users/admin can remove their own rows).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catch_reactions'
      AND policyname = 'catch_reactions_write_visible_unblocked_ins'
  ) THEN
    EXECUTE 'DROP POLICY catch_reactions_write_visible_unblocked_ins ON public.catch_reactions';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catch_reactions'
      AND policyname = 'catch_reactions_write_visible_unblocked_upd'
  ) THEN
    EXECUTE 'DROP POLICY catch_reactions_write_visible_unblocked_upd ON public.catch_reactions';
  END IF;
END;
$$;

CREATE POLICY catch_reactions_write_visible_unblocked_ins
ON public.catch_reactions
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.catches c
    WHERE c.id = catch_reactions.catch_id
      AND c.deleted_at IS NULL
      AND NOT public.is_blocked_either_way(auth.uid(), c.user_id)
      AND c.user_id <> auth.uid()
      AND (
        public.is_admin(auth.uid())
        OR c.visibility = 'public'
        OR (c.visibility = 'followers' AND public.is_following(auth.uid(), c.user_id))
      )
  )
);

CREATE POLICY catch_reactions_write_visible_unblocked_upd
ON public.catch_reactions
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.catches c
    WHERE c.id = catch_reactions.catch_id
      AND c.deleted_at IS NULL
      AND NOT public.is_blocked_either_way(auth.uid(), c.user_id)
      AND c.user_id <> auth.uid()
      AND (
        public.is_admin(auth.uid())
        OR c.visibility = 'public'
        OR (c.visibility = 'followers' AND public.is_following(auth.uid(), c.user_id))
      )
  )
);

-- RESTRICTIVE policies for ratings writes (INSERT, UPDATE).
-- Deletes remain governed by existing owner policies.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ratings'
      AND policyname = 'ratings_write_visible_unblocked_ins'
  ) THEN
    EXECUTE 'DROP POLICY ratings_write_visible_unblocked_ins ON public.ratings';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ratings'
      AND policyname = 'ratings_write_visible_unblocked_upd'
  ) THEN
    EXECUTE 'DROP POLICY ratings_write_visible_unblocked_upd ON public.ratings';
  END IF;
END;
$$;

CREATE POLICY ratings_write_visible_unblocked_ins
ON public.ratings
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.catches c
    WHERE c.id = ratings.catch_id
      AND c.deleted_at IS NULL
      AND c.allow_ratings IS TRUE
      AND NOT public.is_blocked_either_way(auth.uid(), c.user_id)
      AND c.user_id <> auth.uid()
      AND (
        public.is_admin(auth.uid())
        OR c.visibility = 'public'
        OR (c.visibility = 'followers' AND public.is_following(auth.uid(), c.user_id))
      )
  )
);

CREATE POLICY ratings_write_visible_unblocked_upd
ON public.ratings
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.catches c
    WHERE c.id = ratings.catch_id
      AND c.deleted_at IS NULL
      AND c.allow_ratings IS TRUE
      AND NOT public.is_blocked_either_way(auth.uid(), c.user_id)
      AND c.user_id <> auth.uid()
      AND (
        public.is_admin(auth.uid())
        OR c.visibility = 'public'
        OR (c.visibility = 'followers' AND public.is_following(auth.uid(), c.user_id))
      )
  )
);

-- Notes:
-- - Existing permissive owner policies remain; these RESTRICTIVE policies add visibility + block + allow_ratings + no self-react/rate checks.
-- - Deletes are left to existing owner/admin policies so users can remove their own reactions/ratings.
