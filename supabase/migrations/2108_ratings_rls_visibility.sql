-- 2108_ratings_rls_visibility.sql
-- Adjust ratings RLS to allow reads for viewers who can see the catch, while keeping writes owner-only.

SET search_path = public, extensions;

-- Drop legacy owner-all policy if it exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ratings'
      AND policyname = 'ratings_owner_all'
  ) THEN
    DROP POLICY ratings_owner_all ON public.ratings;
  END IF;
END;
$$;

-- Owner-only writes (and owner can always read their own ratings).
CREATE POLICY ratings_owner_mutate
ON public.ratings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Reads allowed when the viewer can see the catch.
CREATE POLICY ratings_read_visible_catches
ON public.ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.catches c
    WHERE c.id = ratings.catch_id
      AND c.deleted_at IS NULL
      AND (
        public.is_admin(auth.uid())
        OR c.user_id = auth.uid()
        OR (auth.uid() IS NULL AND c.visibility = 'public')
        OR (
          auth.uid() IS NOT NULL
          AND NOT public.is_admin(auth.uid())
          AND (
            c.visibility = 'public'
            OR (
              c.visibility = 'followers'
              AND public.is_following(auth.uid(), c.user_id)
            )
          )
        )
      )
  )
);
