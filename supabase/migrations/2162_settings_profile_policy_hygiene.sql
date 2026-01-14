-- 2162_settings_profile_policy_hygiene.sql
-- Purpose: Tighten /settings/profile posture (auth-only) with least-privilege grants + RLS role scoping.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- -------------------------------------------------------------------
-- 0) Defensive grant revokes (ensure PUBLIC/anon cannot touch these tables)
-- -------------------------------------------------------------------
REVOKE ALL PRIVILEGES ON TABLE public.profile_blocks FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.profile_blocks FROM PUBLIC;

-- profiles should already be auth-only; keep this defensive too
REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.profiles FROM PUBLIC;

-- -------------------------------------------------------------------
-- A) Table grants: remove authenticated INSERT/DELETE on profiles
-- -------------------------------------------------------------------
REVOKE INSERT, DELETE ON TABLE public.profiles FROM authenticated;

-- -------------------------------------------------------------------
-- B) profiles_update_self: auth-only + WITH CHECK
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_update_self'
  ) THEN
    CREATE POLICY profiles_update_self ON public.profiles
      FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = id)
      WITH CHECK ((select auth.uid()) = id);
  END IF;
END;
$$;

-- -------------------------------------------------------------------
-- C) profile_blocks policies: auth-only role scoping (logic unchanged)
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS profile_blocks_select_self_or_blocked ON public.profile_blocks;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_select_self_or_blocked'
  ) THEN
    CREATE POLICY profile_blocks_select_self_or_blocked ON public.profile_blocks
      FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = blocker_id OR (select auth.uid()) = blocked_id);
  END IF;
END;
$$;

DROP POLICY IF EXISTS profile_blocks_select_admin_all ON public.profile_blocks;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_select_admin_all'
  ) THEN
    CREATE POLICY profile_blocks_select_admin_all ON public.profile_blocks
      FOR SELECT
      TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (select auth.uid())));
  END IF;
END;
$$;

DROP POLICY IF EXISTS profile_blocks_insert_self ON public.profile_blocks;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_insert_self'
  ) THEN
    CREATE POLICY profile_blocks_insert_self ON public.profile_blocks
      FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = blocker_id);
  END IF;
END;
$$;

DROP POLICY IF EXISTS profile_blocks_insert_admin_all ON public.profile_blocks;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_insert_admin_all'
  ) THEN
    CREATE POLICY profile_blocks_insert_admin_all ON public.profile_blocks
      FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (select auth.uid())));
  END IF;
END;
$$;

DROP POLICY IF EXISTS profile_blocks_delete_self ON public.profile_blocks;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_delete_self'
  ) THEN
    CREATE POLICY profile_blocks_delete_self ON public.profile_blocks
      FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = blocker_id);
  END IF;
END;
$$;

DROP POLICY IF EXISTS profile_blocks_delete_admin_all ON public.profile_blocks;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_delete_admin_all'
  ) THEN
    CREATE POLICY profile_blocks_delete_admin_all ON public.profile_blocks
      FOR DELETE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = (select auth.uid())));
  END IF;
END;
$$;

-- -------------------------------------------------------------------
-- Verification / Evidence (run manually; save outputs under surface evidence/sql/)
-- -------------------------------------------------------------------
-- 1) Table privileges (expect: NO rows for anon/PUBLIC on profile_blocks; NO rows for anon/PUBLIC SELECT on profiles)
-- select table_name, grantee, privilege_type
-- from information_schema.table_privileges
-- where table_schema='public'
--   and table_name in ('profiles','profile_blocks')
--   and grantee in ('PUBLIC','anon','authenticated')
-- order by table_name, grantee, privilege_type;
--
-- 2) RLS policies (expect: profiles_update_self TO authenticated; profile_blocks policies TO authenticated)
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname='public' and tablename in ('profiles','profile_blocks')
-- order by tablename, policyname;
--
-- select tablename, policyname, roles, cmd
-- from pg_policies
-- where schemaname='public' and tablename in ('profiles','profile_blocks')
-- order by tablename, policyname;

COMMIT;
