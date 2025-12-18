-- 2111: ensure report rate-limiting is logged only by enforce_report_rate_limit()
-- so each report creates exactly one entry in public.rate_limits.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.create_report_with_rate_limit(
  p_target_type public.report_target_type,
  p_target_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS public.reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_report public.reports;
  v_reason text := trim(both FROM coalesce(p_reason, ''));
  v_details text := NULLIF(trim(both FROM p_details), '');
  v_can_view boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Early rate-limit check (logging is handled by trigger/enforce_report_rate_limit)
  IF NOT public.check_rate_limit(v_user_id, 'reports', 5, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: reports – max 5 per hour';
  END IF;

  IF v_reason = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  -- Validate target exists and is viewable by reporter
  IF p_target_type = 'catch' THEN
    v_can_view := EXISTS (
      SELECT 1
      FROM public.catches c
      WHERE c.id = p_target_id
        AND c.deleted_at IS NULL
        AND (
          public.is_admin(v_user_id)
          OR c.user_id = v_user_id
          OR (
            c.visibility = 'public'
            AND NOT public.is_blocked_either_way(v_user_id, c.user_id)
          )
          OR (
            c.visibility = 'followers'
            AND public.is_following(v_user_id, c.user_id)
            AND NOT public.is_blocked_either_way(v_user_id, c.user_id)
          )
        )
    );
  ELSIF p_target_type = 'comment' THEN
    v_can_view := EXISTS (
      SELECT 1
      FROM public.catch_comments cc
      JOIN public.catches c ON c.id = cc.catch_id
      WHERE cc.id = p_target_id
        AND cc.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND (
          public.is_admin(v_user_id)
          OR c.user_id = v_user_id
          OR (
            c.visibility = 'public'
            AND NOT public.is_blocked_either_way(v_user_id, c.user_id)
            AND NOT public.is_blocked_either_way(v_user_id, cc.user_id)
          )
          OR (
            c.visibility = 'followers'
            AND public.is_following(v_user_id, c.user_id)
            AND NOT public.is_blocked_either_way(v_user_id, c.user_id)
            AND NOT public.is_blocked_either_way(v_user_id, cc.user_id)
          )
        )
    );
  ELSIF p_target_type = 'profile' THEN
    v_can_view := EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = p_target_id
        AND NOT public.is_blocked_either_way(v_user_id, p.id)
    );
  ELSE
    RAISE EXCEPTION 'Unsupported target type';
  END IF;

  IF NOT v_can_view THEN
    RAISE EXCEPTION 'Target not accessible';
  END IF;

  INSERT INTO public.reports (
    reporter_id,
    target_type,
    target_id,
    reason,
    details
  )
  VALUES (
    v_user_id,
    p_target_type::text,
    p_target_id,
    v_reason,
    v_details
  )
  RETURNING * INTO v_report;

  -- Note: logging to public.rate_limits is handled by enforce_report_rate_limit_trigger.

  RETURN v_report;
END;
$$;
