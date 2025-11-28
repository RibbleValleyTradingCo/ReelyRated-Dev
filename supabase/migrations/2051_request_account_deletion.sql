-- 2051_request_account_deletion.sql
-- Implements user-initiated account deletion (soft-delete + anonymisation) and admin wrapper.
-- See docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md and Phase 2.1 of docs/FEATURE-ROADMAP.md

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
    v_username := 'deleted-user-' || substring(gen_random_uuid()::text, 1, 8);
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

COMMENT ON FUNCTION public.request_account_deletion(text) IS 'Soft-delete/anonymise the authenticated account; preserves audit tables (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';

GRANT EXECUTE ON FUNCTION public.request_account_deletion(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_account(p_target uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
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
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = p_target
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_target;
  END IF;

  IF v_profile.is_deleted THEN
    v_profile_deleted := true;
  ELSE
    v_username := 'deleted-user-' || substring(p_target::text, 1, 8);
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username AND id <> p_target) LOOP
      v_username := 'deleted-user-' || substring(gen_random_uuid()::text, 1, 8);
    END LOOP;

    UPDATE public.profiles
    SET is_deleted = TRUE,
        deleted_at = v_now,
        locked_for_deletion = TRUE,
        username = v_username,
        bio = NULL,
        avatar_path = NULL,
        avatar_url = NULL,
        updated_at = v_now
    WHERE id = p_target;

    v_profile_deleted := true;

    UPDATE public.catches
    SET visibility = 'private',
        deleted_at = COALESCE(deleted_at, v_now),
        updated_at = v_now
    WHERE user_id = p_target;
    GET DIAGNOSTICS v_catches_updated = ROW_COUNT;

    UPDATE public.catch_comments
    SET deleted_at = COALESCE(deleted_at, v_now),
        body = CASE WHEN deleted_at IS NULL THEN '[deleted]' ELSE body END
    WHERE user_id = p_target;
    GET DIAGNOSTICS v_comments_tombstoned = ROW_COUNT;

    DELETE FROM public.catch_reactions WHERE user_id = p_target;
    GET DIAGNOSTICS v_reactions_deleted = ROW_COUNT;

    DELETE FROM public.ratings WHERE user_id = p_target;
    GET DIAGNOSTICS v_ratings_deleted = ROW_COUNT;

    DELETE FROM public.profile_follows WHERE follower_id = p_target OR following_id = p_target;
    GET DIAGNOSTICS v_follows_deleted = ROW_COUNT;

    DELETE FROM public.notifications WHERE user_id = p_target;
    GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;
  END IF;

  INSERT INTO public.moderation_log (
    action,
    target_type,
    target_id,
    user_id,
    catch_id,
    comment_id,
    metadata,
    created_at,
    admin_id
  )
  VALUES (
    'admin_delete_account',
    'profile',
    p_target,
    p_target,
    NULL,
    NULL,
    jsonb_build_object(
      'reason', p_reason,
      'initiated_by', v_admin
    ),
    v_now,
    v_admin
  );

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

COMMENT ON FUNCTION public.admin_delete_account(uuid, text) IS 'Admin-triggered soft-delete/anonymisation of an account; preserves audit tables (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';

GRANT EXECUTE ON FUNCTION public.request_account_deletion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_account(uuid, text) TO authenticated;
