-- 2106_catch_rating_summary.sql
-- Provide a viewer-aware rating summary RPC that enforces catch visibility and aggregates ratings server-side.

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
  v_is_admin boolean := public.is_admin(v_viewer_id);
  v_is_follower boolean := false;
BEGIN
  SELECT id, user_id, visibility, deleted_at, allow_ratings
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND OR v_catch.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  IF v_catch.allow_ratings IS FALSE THEN
    RETURN QUERY
    SELECT v_catch.id, 0::int, NULL::numeric, NULL::int;
    RETURN;
  END IF;

  -- Visibility rules mirror rate_catch_with_rate_limit.
  IF v_viewer_id IS NULL THEN
    IF v_catch.visibility <> 'public' THEN
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  ELSIF NOT v_is_admin THEN
    IF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      v_is_follower := public.is_following(v_viewer_id, v_catch.user_id);
      IF NOT v_is_follower THEN
        RAISE EXCEPTION 'Catch is not accessible';
      END IF;
    ELSIF v_catch.visibility = 'private' THEN
      IF v_catch.user_id <> v_viewer_id THEN
        RAISE EXCEPTION 'Catch is not accessible';
      END IF;
    ELSE
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    v_catch.id,
    COUNT(*)::integer AS rating_count,
    CASE WHEN COUNT(*) > 0 THEN AVG(r.rating)::numeric ELSE NULL::numeric END AS average_rating,
    CASE
      WHEN v_viewer_id IS NULL THEN NULL::integer
      ELSE (
        SELECT r2.rating
        FROM public.ratings r2
        WHERE r2.catch_id = v_catch.id
          AND r2.user_id = v_viewer_id
        LIMIT 1
      )
    END AS your_rating
  FROM public.ratings r
  WHERE r.catch_id = v_catch.id
  GROUP BY v_catch.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO anon;
