-- 2091_rate_limits_insert_policy.sql
-- Allow authenticated users to insert their own rate_limit rows (for triggers/RPCs), keep admin-only read.

SET search_path = public, extensions;

DO $$
BEGIN
  ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rate_limits'
      AND policyname = 'rate_limits_owner_insert'
  ) THEN
    CREATE POLICY rate_limits_owner_insert
      ON public.rate_limits
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;
