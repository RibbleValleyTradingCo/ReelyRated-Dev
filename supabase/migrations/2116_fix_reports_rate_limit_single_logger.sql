-- 2116: Make report rate-limit enforcement single-logger and auth-safe.

SET search_path = public, extensions;

-- Ensure check_rate_limit stays pure (count-only).
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_attempts integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  cutoff timestamptz := now() - make_interval(mins => p_window_minutes);
  attempts integer;
BEGIN
  SELECT count(*) INTO attempts
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at >= cutoff;

  RETURN attempts < p_max_attempts;
END;
$$;

-- Trigger: use reporter_id when available; log exactly once.
CREATE OR REPLACE FUNCTION public.enforce_report_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := COALESCE(NEW.reporter_id, auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT check_rate_limit(v_uid, 'reports', 5, 60) THEN
    RAISE EXCEPTION 'RATE_LIMITED: reports – max 5 per hour';
  END IF;

  INSERT INTO public.rate_limits (user_id, action, created_at)
  VALUES (v_uid, 'reports', now());

  RETURN NEW;
END;
$$;
