-- 2107_catch_rating_summary_owner_zero_fix.sql
-- Refine rating summary: owner/admin visibility, single-row result even with zero ratings, visibility before allow_ratings.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.get_catch_rating_summary(
  p_catch_id uuid
)
RETURNS TABLE (
  catch_id uuid,
  rating_count integer,
  average_rating numeric,
  your_rating integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_viewer_id   uuid    := auth.uid();
  v_catch       RECORD;
  v_is_admin    boolean := public.is_admin(v_viewer_id);
  v_is_follower boolean := false;
BEGIN
  -- Load the catch and basic flags.
  SELECT id, user_id, visibility, deleted_at, allow_ratings
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND OR v_catch.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  -- Visibility rules (aligned with rating RPC semantics):
  --  - Owner/admin: always allowed once the catch exists.
  --  - Anon: only public.
  --  - Auth non-admin/non-owner: public, or followers if is_following(...); private denied.
  IF v_is_admin OR (v_viewer_id IS NOT NULL AND v_catch.user_id = v_viewer_id) THEN
    NULL;
  ELSIF v_viewer_id IS NULL THEN
    IF v_catch.visibility <> 'public' THEN
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  ELSE
    IF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      v_is_follower := public.is_following(v_viewer_id, v_catch.user_id);
      IF NOT v_is_follower THEN
        RAISE EXCEPTION 'Catch is not accessible';
      END IF;
    ELSIF v_catch.visibility = 'private' THEN
      RAISE EXCEPTION 'Catch is not accessible';
    ELSE
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  END IF;

  -- If ratings are disabled, still return a single row with zeros/nulls.
  IF v_catch.allow_ratings IS FALSE THEN
    RETURN QUERY
    SELECT v_catch.id, 0::int, NULL::numeric, NULL::int;
    RETURN;
  END IF;

  -- Always return exactly one row using scalar subqueries for the aggregates.
  RETURN QUERY
  SELECT
    v_catch.id                                                   AS catch_id,
    (
      SELECT COUNT(*)::int
      FROM public.ratings r
      WHERE r.catch_id = v_catch.id
    )                                                            AS rating_count,
    (
      SELECT CASE
               WHEN COUNT(*) > 0 THEN AVG(r.rating)::numeric
               ELSE NULL::numeric
             END
      FROM public.ratings r
      WHERE r.catch_id = v_catch.id
    )                                                            AS average_rating,
    CASE
      WHEN v_viewer_id IS NULL THEN NULL::int
      ELSE (
        SELECT r2.rating
        FROM public.ratings r2
        WHERE r2.catch_id = v_catch.id
          AND r2.user_id  = v_viewer_id
        LIMIT 1
      )
    END                                                          AS your_rating;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO anon;
