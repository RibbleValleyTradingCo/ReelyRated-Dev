-- 2163_settings_profile_rpc_search_path_hygiene.sql
-- Harden SECURITY DEFINER RPC search_path to empty and schema-qualify extension calls; no behavior change.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE OR REPLACE FUNCTION public.request_account_export()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile jsonb;
  v_catches jsonb;
  v_comments jsonb;
  v_ratings jsonb;
  v_reactions jsonb;
  v_follows jsonb;
  v_notifications jsonb;
  v_reports jsonb;
  v_warnings jsonb;
  v_moderation_log jsonb;
  v_admin_membership jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Profile (single object)
  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  -- Catches authored by user
  SELECT coalesce(jsonb_agg(c.*), '[]'::jsonb) INTO v_catches
  FROM public.catches c
  WHERE c.user_id = v_user_id;

  -- Comments authored by user
  SELECT coalesce(jsonb_agg(cc.*), '[]'::jsonb) INTO v_comments
  FROM public.catch_comments cc
  WHERE cc.user_id = v_user_id;

  -- Ratings authored by user
  SELECT coalesce(jsonb_agg(r.*), '[]'::jsonb) INTO v_ratings
  FROM public.ratings r
  WHERE r.user_id = v_user_id;

  -- Reactions authored by user
  SELECT coalesce(jsonb_agg(cr.*), '[]'::jsonb) INTO v_reactions
  FROM public.catch_reactions cr
  WHERE cr.user_id = v_user_id;

  -- Follows (both directions)
  SELECT coalesce(jsonb_agg(f.*), '[]'::jsonb) INTO v_follows
  FROM public.profile_follows f
  WHERE f.follower_id = v_user_id
     OR f.following_id = v_user_id;

  -- Notifications inbox
  SELECT coalesce(jsonb_agg(n.*), '[]'::jsonb) INTO v_notifications
  FROM public.notifications n
  WHERE n.user_id = v_user_id;

  -- Reports: reporter or target user
  SELECT coalesce(jsonb_agg(rep.*), '[]'::jsonb) INTO v_reports
  FROM public.reports rep
  WHERE rep.reporter_id = v_user_id
     OR rep.target_id = v_user_id;

  -- Warnings issued to user
  SELECT coalesce(jsonb_agg(w.*), '[]'::jsonb) INTO v_warnings
  FROM public.user_warnings w
  WHERE w.user_id = v_user_id;

  -- Moderation log rows involving user or their content
  SELECT coalesce(jsonb_agg(ml.*), '[]'::jsonb) INTO v_moderation_log
  FROM public.moderation_log ml
  WHERE ml.user_id = v_user_id
     OR (ml.target_type = 'user' AND ml.target_id = v_user_id)
     OR ml.catch_id IN (SELECT id FROM public.catches WHERE user_id = v_user_id)
     OR ml.comment_id IN (SELECT id FROM public.catch_comments WHERE user_id = v_user_id);

  -- Admin membership (if any)
  SELECT to_jsonb(a.*) INTO v_admin_membership
  FROM public.admin_users a
  WHERE a.user_id = v_user_id;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'catches', v_catches,
    'comments', v_comments,
    'ratings', v_ratings,
    'reactions', v_reactions,
    'follows', v_follows,
    'notifications', v_notifications,
    'reports', v_reports,
    'warnings', v_warnings,
    'moderation_log', v_moderation_log,
    'admin_membership', v_admin_membership
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile RECORD;
  v_now timestamptz := now();
  v_username text;
  v_profile_deleted boolean := false;
  v_catches_updated integer := 0;
  v_comments_tombstoned integer := 0;
  v_reactions_deleted integer := 0;
  v_ratings_deleted integer := 0;
  v_follows_deleted integer := 0;
  v_notifications_deleted integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', v_user_id;
  END IF;

  IF v_profile.is_deleted THEN
    v_profile_deleted := true;
    RETURN jsonb_build_object(
      'profile_deleted', v_profile_deleted,
      'catches_updated', v_catches_updated,
      'comments_tombstoned', v_comments_tombstoned,
      'reactions_deleted', v_reactions_deleted,
      'ratings_deleted', v_ratings_deleted,
      'follows_deleted', v_follows_deleted,
      'notifications_deleted', v_notifications_deleted
    );
  END IF;

  -- Generate a tombstone username, avoid collisions.
  v_username := 'deleted-user-' || substring(v_user_id::text, 1, 8);
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username AND id <> v_user_id) LOOP
    v_username := 'deleted-user-' || substring(extensions.gen_random_uuid()::text, 1, 8);
  END LOOP;

  UPDATE public.profiles
  SET is_deleted = TRUE,
      deleted_at = v_now,
      locked_for_deletion = TRUE,
      username = v_username,
      bio = NULL,
      avatar_path = NULL,
      avatar_url = NULL,
      -- moderation_status could be set to a terminal state if an enum supports it; keeping existing value for now.
      updated_at = v_now
  WHERE id = v_user_id;

  v_profile_deleted := true;

  UPDATE public.catches
  SET visibility = 'private',
      deleted_at = COALESCE(deleted_at, v_now),
      updated_at = v_now
  WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_catches_updated = ROW_COUNT;

  UPDATE public.catch_comments
  SET deleted_at = COALESCE(deleted_at, v_now),
      body = CASE WHEN deleted_at IS NULL THEN '[deleted]' ELSE body END
  WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_comments_tombstoned = ROW_COUNT;

  DELETE FROM public.catch_reactions WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_reactions_deleted = ROW_COUNT;

  DELETE FROM public.ratings WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_ratings_deleted = ROW_COUNT;

  DELETE FROM public.profile_follows WHERE follower_id = v_user_id OR following_id = v_user_id;
  GET DIAGNOSTICS v_follows_deleted = ROW_COUNT;

  DELETE FROM public.notifications WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;

  -- Audit tables intentionally preserved: reports, user_warnings, moderation_log.

  RETURN jsonb_build_object(
    'profile_deleted', v_profile_deleted,
    'catches_updated', v_catches_updated,
    'comments_tombstoned', v_comments_tombstoned,
    'reactions_deleted', v_reactions_deleted,
    'ratings_deleted', v_ratings_deleted,
    'follows_deleted', v_follows_deleted,
    'notifications_deleted', v_notifications_deleted
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_profile(
  p_blocked_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Verification / Evidence (run manually; save output under surface evidence/sql/)
-- Query A: posture + search_path
-- select n.nspname as schema_name,
--        p.proname,
--        pg_get_function_identity_arguments(p.oid) as identity_args,
--        p.prosecdef,
--        (
--          select regexp_replace(cfg, '^search_path=', '')
--          from unnest(p.proconfig) cfg
--          where cfg like 'search_path=%'
--          limit 1
--        ) as search_path_value,
--        p.proowner::regrole as owner_role,
--        p.proacl
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in ('request_account_deletion', 'request_account_export', 'unblock_profile')
-- order by p.proname, identity_args;
--
-- Query B: routine privileges
-- select routine_schema, routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name in ('request_account_deletion', 'request_account_export', 'unblock_profile')
--   and grantee in ('PUBLIC', 'anon', 'authenticated', 'postgres', 'service_role')
-- order by routine_name, grantee;

COMMIT;
