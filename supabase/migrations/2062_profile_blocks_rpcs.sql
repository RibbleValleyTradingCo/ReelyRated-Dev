-- 2062_profile_blocks_rpcs.sql
-- RPCs for blocking/unblocking profiles and helper to check mutual blocks.
-- See docs/BLOCK-MUTE-DESIGN.md.

SET search_path = public, extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'block_profile'
  ) THEN
    DROP FUNCTION public.block_profile(uuid, text);
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'unblock_profile'
  ) THEN
    DROP FUNCTION public.unblock_profile(uuid);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.block_profile(
  p_blocked_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_blocker_id uuid := auth.uid();
BEGIN
  IF v_blocker_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_blocker_id = p_blocked_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  INSERT INTO public.profile_blocks (blocker_id, blocked_id, reason)
  VALUES (v_blocker_id, p_blocked_id, p_reason)
  ON CONFLICT (blocker_id, blocked_id) DO UPDATE
    SET reason = EXCLUDED.reason,
        created_at = now();

  -- Clean up follow relationships in either direction
  DELETE FROM public.profile_follows
  WHERE (follower_id = v_blocker_id AND following_id = p_blocked_id)
     OR (follower_id = p_blocked_id AND following_id = v_blocker_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_profile(
  p_blocked_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_blocker_id uuid := auth.uid();
BEGIN
  IF v_blocker_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.profile_blocks
  WHERE blocker_id = v_blocker_id
    AND blocked_id = p_blocked_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_blocked_either_way(
  p_user_id uuid,
  p_other_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_blocks pb
    WHERE (pb.blocker_id = p_user_id AND pb.blocked_id = p_other_id)
       OR (pb.blocker_id = p_other_id AND pb.blocked_id = p_user_id)
  );
$$;

COMMENT ON FUNCTION public.block_profile(uuid, text) IS 'Blocks another profile (and cleans follow links). See docs/BLOCK-MUTE-DESIGN.md.';
COMMENT ON FUNCTION public.unblock_profile(uuid) IS 'Unblocks a previously blocked profile. See docs/BLOCK-MUTE-DESIGN.md.';
COMMENT ON FUNCTION public.is_blocked_either_way(uuid, uuid) IS 'Returns true if either user has blocked the other (see docs/BLOCK-MUTE-DESIGN.md).';

GRANT EXECUTE ON FUNCTION public.block_profile(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_profile(uuid) TO authenticated;
