-- 2097_block_admin_catch_inserts.sql
-- Prevent admin accounts (moderation-only) from inserting catches.

SET search_path = public, extensions;

-- Scope existing owner policy to non-admins for INSERT/UPDATE/DELETE while keeping it for SELECT.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'catches' AND policyname = 'catches_owner_all'
  ) THEN
    DROP POLICY catches_owner_all ON public.catches;
  END IF;

  CREATE POLICY catches_owner_all ON public.catches
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY catches_owner_mutate ON public.catches
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND NOT public.is_admin(auth.uid()));

  CREATE POLICY catches_owner_update_delete ON public.catches
    FOR UPDATE
    USING (auth.uid() = user_id AND NOT public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id AND NOT public.is_admin(auth.uid()));
END;
$$;
