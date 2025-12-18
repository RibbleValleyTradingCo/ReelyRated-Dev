-- 2117: Harden profile_follows RLS (blocked follow prevention + admin visibility) and guard follow RPC.

SET search_path = public, extensions;

-- A) Admin visibility for follow edges
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_follows' AND policyname = 'profile_follows_admin_select_all'
  ) THEN
    DROP POLICY profile_follows_admin_select_all ON public.profile_follows;
  END IF;

  CREATE POLICY profile_follows_admin_select_all ON public.profile_follows
    FOR SELECT
    USING (public.is_admin(auth.uid()));
END;
$$;

-- B) Blocked/self guard on follow inserts (restrictive)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_follows' AND policyname = 'profile_follows_insert_not_blocked'
  ) THEN
    DROP POLICY profile_follows_insert_not_blocked ON public.profile_follows;
  END IF;

  CREATE POLICY profile_follows_insert_not_blocked ON public.profile_follows
    AS RESTRICTIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = follower_id
      AND following_id <> auth.uid()
      AND NOT public.is_blocked_either_way(auth.uid(), following_id)
    );
END;
$$;

-- C) Defense-in-depth: RPC guard for blocked follows
CREATE OR REPLACE FUNCTION public.follow_profile_with_rate_limit(
  p_following_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_follow_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_user_id = p_following_id THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;

  IF public.is_blocked_either_way(v_user_id, p_following_id) THEN
    RAISE EXCEPTION 'Target not accessible';
  END IF;

  IF NOT public.check_rate_limit(v_user_id, 'follows', 30, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: follows – max 30 per hour';
  END IF;

  INSERT INTO public.profile_follows (follower_id, following_id, created_at)
  VALUES (v_user_id, p_following_id, now())
  ON CONFLICT (follower_id, following_id) DO NOTHING
  RETURNING id INTO v_follow_id;

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (v_user_id, 'follows', now());

  RETURN COALESCE(
    v_follow_id,
    (SELECT id FROM public.profile_follows WHERE follower_id = v_user_id AND following_id = p_following_id)
  );
END;
$$;
