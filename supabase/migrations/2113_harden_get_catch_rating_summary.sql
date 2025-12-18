-- 2113: Harden get_catch_rating_summary to enforce visibility and block rules.

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
  v_viewer_id uuid := auth.uid();
  v_catch RECORD;
  v_is_admin boolean := COALESCE(public.is_admin(v_viewer_id), false);
  v_is_follower boolean := false;
BEGIN
  -- Load catch; require it to exist and not be soft-deleted.
  SELECT id, user_id, visibility, deleted_at, allow_ratings
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND OR v_catch.deleted_at IS NOT NULL THEN
    RETURN;
  END IF;

  -- Block rules: if blocked either way, deny (admins bypass).
  IF NOT v_is_admin AND v_viewer_id IS NOT NULL THEN
    IF public.is_blocked_either_way(v_viewer_id, v_catch.user_id) THEN
      RETURN;
    END IF;
  END IF;

  -- Visibility rules:
  -- Admins and owners: allowed.
  IF v_is_admin OR (v_viewer_id IS NOT NULL AND v_viewer_id = v_catch.user_id) THEN
    NULL;
  ELSIF v_viewer_id IS NULL THEN
    -- Anonymous: only public
    IF v_catch.visibility <> 'public' THEN
      RETURN;
    END IF;
  ELSE
    -- Authenticated, non-admin, non-owner
    IF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      v_is_follower := COALESCE(public.is_following(v_viewer_id, v_catch.user_id), false);
      IF NOT v_is_follower THEN
        RETURN;
      END IF;
    ELSE
      -- private or unknown
      RETURN;
    END IF;
  END IF;

  -- Ratings disabled: still return one row with zero/nulls.
  IF v_catch.allow_ratings IS FALSE THEN
    RETURN QUERY
    SELECT v_catch.id, 0::int, NULL::numeric, NULL::int;
    RETURN;
  END IF;

  -- Return exactly one row with aggregates.
  RETURN QUERY
  SELECT
    v_catch.id AS catch_id,
    (
      SELECT count(*)::int
      FROM public.ratings r
      WHERE r.catch_id = v_catch.id
    ) AS rating_count,
    (
      SELECT CASE
               WHEN count(*) > 0 THEN avg(r.rating)::numeric
               ELSE NULL::numeric
             END
      FROM public.ratings r
      WHERE r.catch_id = v_catch.id
    ) AS average_rating,
    CASE
      WHEN v_viewer_id IS NULL THEN NULL::int
      ELSE (
        SELECT r2.rating
        FROM public.ratings r2
        WHERE r2.catch_id = v_catch.id
          AND r2.user_id = v_viewer_id
        LIMIT 1
      )
    END AS your_rating;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO anon;
