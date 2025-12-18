-- 2095_rate_limit_functions_alignment_final.sql
-- Final alignment of rate limit helper functions with test expectations.
-- Summary:
-- - check_rate_limit/get_rate_limit_status: count per (p_user_id, p_action) within window; insert only when under limit.
-- - user_rate_limits: aggregate per user (p_user_id) to avoid cross-user leakage.
-- - cleanup_rate_limits: delete rows older than cutoff and return a single int via ROW_COUNT.

SET search_path = public, extensions;

-- check_rate_limit: windowed per-user/action, insert only when allowed.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_attempts INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - make_interval(mins => p_window_minutes);
  v_attempts INTEGER;
BEGIN
  SELECT count(*)::int INTO v_attempts
  FROM public.rate_limits rl
  WHERE rl.user_id = p_user_id
    AND rl.action = p_action
    AND rl.created_at >= v_cutoff;

  IF v_attempts >= p_max_attempts THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (p_user_id, p_action, now());

  RETURN TRUE;
END;
$$;

-- get_rate_limit_status: per-user/action windowed summary.
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
  p_user_id UUID,
  p_action TEXT,
  p_max_attempts INTEGER,
  p_window_minutes INTEGER
)
RETURNS TABLE (
  attempts_used INTEGER,
  attempts_remaining INTEGER,
  is_limited BOOLEAN,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - make_interval(mins => p_window_minutes);
BEGIN
  RETURN QUERY
  WITH attempts AS (
    SELECT COALESCE(count(*)::int, 0) AS attempts_used
    FROM public.rate_limits rl
    WHERE rl.user_id = p_user_id
      AND rl.action = p_action
      AND rl.created_at >= v_cutoff
  )
  SELECT
    attempts.attempts_used,
    GREATEST(p_max_attempts - attempts.attempts_used, 0)::int AS attempts_remaining,
    attempts.attempts_used >= p_max_attempts AS is_limited,
    v_cutoff + make_interval(mins => p_window_minutes) AS reset_at
  FROM attempts;
END;
$$;

-- user_rate_limits: per-user aggregation to avoid cross-user data.
CREATE OR REPLACE FUNCTION public.user_rate_limits(
  p_user_id UUID
)
RETURNS TABLE (
  action TEXT,
  count INTEGER,
  oldest_attempt TIMESTAMPTZ,
  newest_attempt TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rl.action,
    count(*)::int AS count,
    MIN(rl.created_at) AS oldest_attempt,
    MAX(rl.created_at) AS newest_attempt
  FROM public.rate_limits rl
  WHERE rl.user_id = p_user_id
  GROUP BY rl.action;
END;
$$;

-- cleanup_rate_limits: delete old rows and return deleted count as int.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  DELETE FROM public.rate_limits rl
  WHERE rl.created_at < now() - interval '2 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN COALESCE(v_deleted, 0);
END;
$$;
