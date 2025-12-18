-- 2094_rate_limit_functions_align_with_tests.sql
-- Summary:
-- - user_rate_limits currently aggregates globally; tests assume per-user.
-- - cleanup_rate_limits DELETE ... RETURNING can error with multiple rows; tests expect a single int result.
-- - get_rate_limit_status/check_rate_limit should count per (user_id, action) within the window and align with test expectations.

SET search_path = public, extensions;

-- Ensure check_rate_limit stays aligned: per-user/action windowed count, insert on allow, no insert on block.
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

-- Align get_rate_limit_status with test expectations; per-user/action windowed counts.
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
    SELECT count(*)::int AS attempts_used
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

-- Make user_rate_limits per-user to match tests; include oldest/newest timestamps.
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

-- Cleanup should delete many rows and return a single int (number deleted).
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
