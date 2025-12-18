-- 2105_react_catch_visibility_fix.sql
-- Align reaction visibility with ratings: public allowed, followers require follow, private denied, owners cannot react.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.react_to_catch_with_rate_limit(
  p_catch_id uuid,
  p_reaction text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_reaction public.reaction_type := COALESCE(NULLIF(p_reaction, ''), 'like')::public.reaction_type;
  v_catch RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Visibility rules:
  -- - Owner cannot react to own catch.
  -- - Public: anyone can react.
  -- - Followers: only followers (public.is_following(viewer, owner)).
  -- - Private: no reactions from others.
  -- This is intentionally aligned with rate_catch_with_rate_limit visibility checks.
  SELECT id, user_id, visibility, deleted_at
  INTO v_catch
  FROM public.catches
  WHERE id = p_catch_id;

  IF NOT FOUND OR v_catch.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Catch is not accessible';
  END IF;

  IF v_catch.user_id = v_user_id THEN
    RAISE EXCEPTION 'You cannot react to your own catch';
  END IF;

  IF NOT public.is_admin(v_user_id) THEN
    IF v_catch.visibility = 'public' THEN
      NULL;
    ELSIF v_catch.visibility = 'followers' THEN
      IF NOT public.is_following(v_user_id, v_catch.user_id) THEN
        RAISE EXCEPTION 'Catch is not accessible';
      END IF;
    ELSIF v_catch.visibility = 'private' THEN
      RAISE EXCEPTION 'Catch is not accessible';
    ELSE
      RAISE EXCEPTION 'Catch is not accessible';
    END IF;
  END IF;

  IF NOT public.check_rate_limit(v_user_id, 'reactions', 50, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: reactions – max 50 per hour';
  END IF;

  INSERT INTO public.catch_reactions (catch_id, user_id, reaction, created_at)
  VALUES (p_catch_id, v_user_id, v_reaction::text, now())
  ON CONFLICT (user_id, catch_id) DO UPDATE
    SET reaction = EXCLUDED.reaction, created_at = now();

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (v_user_id, 'reactions', now());

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.react_to_catch_with_rate_limit(uuid, text) TO authenticated;
