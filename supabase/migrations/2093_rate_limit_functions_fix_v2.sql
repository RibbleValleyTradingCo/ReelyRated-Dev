-- 2093_rate_limit_functions_fix_v2.sql
-- Align rate limit helper functions with app/test expectations and fix type/privilege issues.

SET search_path = public, extensions;

-- get_rate_limit_status: cast counts to int to match declared return types.
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

-- user_rate_limits: make security definer and ensure counts are int.
CREATE OR REPLACE FUNCTION public.user_rate_limits()
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
  GROUP BY rl.action;
END;
$$;

-- cleanup_rate_limits: make security definer and cast deleted count to int.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits rl
  WHERE rl.created_at < now() - interval '2 hours'
  RETURNING 1 INTO deleted_count;

  RETURN COALESCE(deleted_count, 0);
END;
$$;
