-- 2161_settings_profile_lockdown.sql
-- Purpose: Auth-only hardening for /settings/profile surface (least-privilege, idempotent).

-- -------------------------------------------------------------------
-- A) Lock down table grants (profiles + profile_blocks)
-- -------------------------------------------------------------------
REVOKE ALL PRIVILEGES ON TABLE public.profile_blocks FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.profile_blocks FROM PUBLIC;

REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.profiles FROM PUBLIC;

-- -------------------------------------------------------------------
-- B) RLS policy: auth-only select on profiles
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_authenticated'
  ) THEN
    CREATE POLICY profiles_select_authenticated ON public.profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END;
$$;

-- -------------------------------------------------------------------
-- C) RPC EXECUTE allowlist (auth-only)
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.request_account_export()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.request_account_export() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.request_account_export() FROM anon;
    GRANT EXECUTE ON FUNCTION public.request_account_export() TO authenticated;
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.request_account_deletion(text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.request_account_deletion(text) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.request_account_deletion(text) FROM anon;
    GRANT EXECUTE ON FUNCTION public.request_account_deletion(text) TO authenticated;
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.unblock_profile(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.unblock_profile(uuid) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.unblock_profile(uuid) FROM anon;
    GRANT EXECUTE ON FUNCTION public.unblock_profile(uuid) TO authenticated;
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
-- 2) RLS policy (expect: profiles_select_authenticated exists; profiles_select_all absent)
-- select schemaname, tablename, policyname, roles, cmd, qual
-- from pg_policies
-- where schemaname='public' and tablename='profiles'
-- order by policyname;
--
-- 3) Routine privileges (expect: only authenticated/postgres/service_role; NO PUBLIC/anon)
-- select routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema='public'
--   and routine_name in ('request_account_export','request_account_deletion','unblock_profile')
-- order by routine_name, grantee;
