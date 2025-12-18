-- 2089_lockdown_rate_limits.sql
-- Harden public.rate_limits: remove user-level access policies; allow optional admin read only.

SET search_path = public, extensions;

-- RLS is already enabled; ensure no user-facing policies remain and add admin-only read if needed.
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Drop existing owner policy if present
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rate_limits'
      AND policyname = 'rate_limits_owner_all'
  ) THEN
    DROP POLICY rate_limits_owner_all ON public.rate_limits;
  END IF;

  -- Drop any other existing policies on rate_limits except the admin read policy
  FOR rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rate_limits'
      AND policyname <> 'rate_limits_admin_select'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.rate_limits', rec.policyname);
  END LOOP;

  -- Admin-only SELECT (optional debugging/inspection)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rate_limits'
      AND policyname = 'rate_limits_admin_select'
  ) THEN
    CREATE POLICY rate_limits_admin_select ON public.rate_limits
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.admin_users au
          WHERE au.user_id = auth.uid()
        )
      );
  END IF;
END;
$$;
