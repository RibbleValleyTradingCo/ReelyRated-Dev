-- 2047_admin_clear_moderation_status.sql
-- Purpose: allow admins to clear a user's moderation status (lift suspension/ban) while logging the action.

SET search_path = public, extensions;

DROP FUNCTION IF EXISTS public.admin_clear_moderation_status(uuid, text);

CREATE OR REPLACE FUNCTION public.admin_clear_moderation_status(
  p_user_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  UPDATE public.profiles
  SET moderation_status = 'active',
      suspension_until = NULL,
      updated_at = now()
  WHERE id = p_user_id;

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
    'clear_moderation',
    'profile',
    p_user_id,
    p_user_id,
    NULL,
    NULL,
    jsonb_build_object('reason', coalesce(nullif(p_reason, ''), 'Cleared by admin')),
    now(),
    v_admin
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_clear_moderation_status(uuid, text) TO authenticated;
