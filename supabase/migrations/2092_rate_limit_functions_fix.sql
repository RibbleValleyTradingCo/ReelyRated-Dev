-- 2092_rate_limit_functions_fix.sql
-- Refresh rate limit helper functions to align with app tests and remove ambiguous columns.

SET search_path = public, extensions;

-- Drop existing versions so we can safely change RETURN TABLE shapes
DROP FUNCTION IF EXISTS public.get_rate_limit_status(uuid, text, integer, integer);
DROP FUNCTION IF EXISTS public.user_rate_limits();

-- check_rate_limit: allow if under limit; insert on allow; no insert when blocked.
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
  SELECT count(*) INTO v_attempts
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

-- get_rate_limit_status: disambiguated columns, returns attempts_used/remaining/is_limited/reset_at.
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
    SELECT count(*) AS attempts_used
    FROM public.rate_limits rl
    WHERE rl.user_id = p_user_id
      AND rl.action = p_action
      AND rl.created_at >= v_cutoff
  )
  SELECT
    attempts.attempts_used,
    GREATEST(p_max_attempts - attempts.attempts_used, 0) AS attempts_remaining,
    attempts.attempts_used >= p_max_attempts AS is_limited,
    v_cutoff + make_interval(mins => p_window_minutes) AS reset_at
  FROM attempts;
END;
$$;

-- user_rate_limits: per-action summary with oldest/newest attempts.
CREATE OR REPLACE FUNCTION public.user_rate_limits()
RETURNS TABLE (
  action TEXT,
  count INTEGER,
  oldest_attempt TIMESTAMPTZ,
  newest_attempt TIMESTAMPTZ
)
LANGUAGE plpgsql
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

-- cleanup_rate_limits: drop rows older than 2 hours, keep recent.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
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
