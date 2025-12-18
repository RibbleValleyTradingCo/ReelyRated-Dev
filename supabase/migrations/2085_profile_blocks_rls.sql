-- 2085_profile_blocks_rls.sql
-- Enable RLS and add policies for profile_blocks per RLS-DESIGN (blocker/blocked visibility, blocker-only writes, admin override).

SET search_path = public, extensions;

-- Enable RLS
ALTER TABLE public.profile_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_blocks FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- SELECT: blocker or blocked can see their rows
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks' AND policyname = 'profile_blocks_select_self_or_blocked'
  ) THEN
    DROP POLICY profile_blocks_select_self_or_blocked ON public.profile_blocks;
  END IF;
  CREATE POLICY profile_blocks_select_self_or_blocked ON public.profile_blocks
    FOR SELECT
    USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

  -- SELECT: admins can see all rows
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks' AND policyname = 'profile_blocks_select_admin_all'
  ) THEN
    DROP POLICY profile_blocks_select_admin_all ON public.profile_blocks;
  END IF;
  CREATE POLICY profile_blocks_select_admin_all ON public.profile_blocks
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

  -- INSERT: blocker can create rows where they are the blocker
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks' AND policyname = 'profile_blocks_insert_self'
  ) THEN
    DROP POLICY profile_blocks_insert_self ON public.profile_blocks;
  END IF;
  CREATE POLICY profile_blocks_insert_self ON public.profile_blocks
    FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

  -- INSERT: admins can insert any row
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks' AND policyname = 'profile_blocks_insert_admin_all'
  ) THEN
    DROP POLICY profile_blocks_insert_admin_all ON public.profile_blocks;
  END IF;
  CREATE POLICY profile_blocks_insert_admin_all ON public.profile_blocks
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

  -- DELETE: blocker can delete blocks they created
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks' AND policyname = 'profile_blocks_delete_self'
  ) THEN
    DROP POLICY profile_blocks_delete_self ON public.profile_blocks;
  END IF;
  CREATE POLICY profile_blocks_delete_self ON public.profile_blocks
    FOR DELETE
    USING (auth.uid() = blocker_id);

  -- DELETE: admins can delete any row
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks' AND policyname = 'profile_blocks_delete_admin_all'
  ) THEN
    DROP POLICY profile_blocks_delete_admin_all ON public.profile_blocks;
  END IF;
  CREATE POLICY profile_blocks_delete_admin_all ON public.profile_blocks
    FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));
END;
$$;
