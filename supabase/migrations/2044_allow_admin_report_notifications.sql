-- 2044_allow_admin_report_notifications.sql
-- Purpose: allow non-admin users to create admin_report notifications targeted at admins, while keeping all other admin_* types restricted.

SET search_path = public, extensions;

DROP FUNCTION IF EXISTS public.create_notification(uuid, text, public.notification_type, uuid, uuid, uuid, jsonb);

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_message text,
  p_type public.notification_type,
  p_actor_id uuid DEFAULT NULL,
  p_catch_id uuid DEFAULT NULL,
  p_comment_id uuid DEFAULT NULL,
  p_extra_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid;
  v_requester uuid := auth.uid();
  v_is_admin boolean;
  v_recipient_is_admin boolean;
BEGIN
  IF v_requester IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = v_requester
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    IF p_type = 'admin_report'::public.notification_type THEN
      SELECT EXISTS (
        SELECT 1 FROM public.admin_users au WHERE au.user_id = p_user_id
      ) INTO v_recipient_is_admin;

      IF NOT v_recipient_is_admin THEN
        RAISE EXCEPTION 'Not permitted to send this notification';
      END IF;
    ELSIF p_user_id = v_requester THEN
      NULL;
    ELSIF p_actor_id IS NOT NULL AND p_actor_id = v_requester THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Not permitted to send this notification';
    END IF;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    actor_id,
    type,
    message,
    catch_id,
    comment_id,
    extra_data,
    is_read,
    created_at
  )
  VALUES (
    p_user_id,
    p_actor_id,
    p_type::text,
    p_message,
    p_catch_id,
    p_comment_id,
    p_extra_data,
    false,
    now()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
