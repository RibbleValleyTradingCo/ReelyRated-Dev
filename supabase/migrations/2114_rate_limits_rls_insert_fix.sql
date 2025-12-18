-- 2114: Normalize rate_limits RLS insert policy (self-insert only) and keep admin select.

SET search_path = public, extensions;

-- Ensure RLS is enabled (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'rate_limits'
      AND c.relrowsecurity = true
  ) THEN
    EXECUTE 'ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY';
  END IF;
END;
$$;

-- Drop legacy/duplicate insert policies, keep admin select intact.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rate_limits'
      AND policyname = 'rate_limits_owner_all'
  ) THEN
    EXECUTE 'DROP POLICY rate_limits_owner_all ON public.rate_limits';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rate_limits'
      AND policyname = 'rate_limits_owner_insert'
  ) THEN
    EXECUTE 'DROP POLICY rate_limits_owner_insert ON public.rate_limits';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rate_limits'
      AND policyname = 'rate_limits_self_insert'
  ) THEN
    EXECUTE 'DROP POLICY rate_limits_self_insert ON public.rate_limits';
  END IF;
END;
$$;

-- Single insert policy: authenticated users can insert only their own rows.
CREATE POLICY rate_limits_self_insert
ON public.rate_limits
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Verification (manual, run as a normal auth user in SQL editor):
-- Should succeed:
-- INSERT INTO public.rate_limits (user_id, action) VALUES ('<viewer-uuid>', 'comments');
-- Should fail (RLS):
-- INSERT INTO public.rate_limits (user_id, action) VALUES ('<other-uuid>', 'comments');
