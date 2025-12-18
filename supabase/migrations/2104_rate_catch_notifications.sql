-- 2104_rate_catch_notifications.sql
-- Extend rate_catch_with_rate_limit to emit server-side new_rating notifications with fresh actor username.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.rate_catch_with_rate_limit(
  p_catch_id uuid,
  p_rating int
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_catch RECORD;
  v_is_admin boolean := public.is_admin(v_user_id);
  v_is_follower boolean := false;
  v_actor_username text;
  v_catch_title text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, user_id, visibility, deleted_at, allow_ratings, title
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  IF v_catch.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  IF v_catch.allow_ratings IS FALSE THEN
    RAISE EXCEPTION 'Ratings are disabled for this catch';
  END IF;

  IF v_catch.user_id = v_user_id THEN
    RAISE EXCEPTION 'You cannot rate your own catch';
  END IF;

  IF NOT v_is_admin THEN
    IF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      v_is_follower := public.is_following(v_user_id, v_catch.user_id);
      IF NOT v_is_follower THEN
        RAISE EXCEPTION 'Catch is not accessible';
      END IF;
    ELSIF v_catch.visibility = 'private' THEN
      -- Only owner or admin can view; owner already blocked above, so non-admin cannot rate private.
      RAISE EXCEPTION 'Catch is not accessible';
    ELSE
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 10 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 10';
  END IF;

  IF NOT public.check_rate_limit(v_user_id, 'ratings', 50, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: ratings – max 50 per hour';
  END IF;

  INSERT INTO public.ratings (catch_id, user_id, rating, created_at)
  VALUES (p_catch_id, v_user_id, p_rating, now())
  ON CONFLICT (user_id, catch_id) DO UPDATE
    SET rating = EXCLUDED.rating, created_at = now()
  RETURNING id INTO v_id;

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (v_user_id, 'ratings', now());

  -- Note: Block relationships are not enforced here; access is currently governed by visibility/auth only.
  -- Tightening to consult is_blocked_either_way would be a deliberate behaviour change in a future pass.

  -- Look up the freshest actor username and emit the notification on the server.
  SELECT username
  INTO v_actor_username
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_actor_username IS NULL THEN
    v_actor_username := 'Someone';
  END IF;

  v_catch_title := coalesce(v_catch.title, 'your catch');

  PERFORM public.create_notification(
    p_user_id    := v_catch.user_id,
    p_message    := format('%s rated your catch "%s" %s/10.', v_actor_username, v_catch_title, p_rating),
    p_type       := 'new_rating',
    p_actor_id   := v_user_id,
    p_catch_id   := v_catch.id,
    p_comment_id := NULL,
    p_extra_data := jsonb_build_object(
      'rating', p_rating,
      'actor_username', v_actor_username,
      'catch_title', v_catch_title
    )
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rate_catch_with_rate_limit(uuid, int) TO authenticated;
