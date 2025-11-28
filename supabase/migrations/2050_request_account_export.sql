-- 2050_request_account_export.sql
-- Implements request_account_export RPC (read-only JSON export for current user)
-- See docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.request_account_export()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

COMMENT ON FUNCTION public.request_account_export IS 'Returns a JSON export of the authenticated user''s data (see docs/ACCOUNT-DELETION-AND-EXPORT-DESIGN.md).';

GRANT EXECUTE ON FUNCTION public.request_account_export() TO authenticated;
