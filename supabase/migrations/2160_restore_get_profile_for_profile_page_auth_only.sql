-- 2160_restore_get_profile_for_profile_page_auth_only.sql
-- Purpose: Restore missing auth-only profile page RPC (anti-enumeration).
-- Contract: auth-only; return 0 rows for not found / blocked / private / deleted profiles.
-- Security: SECURITY INVOKER; explicit EXECUTE allowlist (authenticated only).

CREATE OR REPLACE FUNCTION public.get_profile_for_profile_page(p_username text)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_path text,
  avatar_url text,
  bio text,
  is_private boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid := auth.uid();
BEGIN
  IF v_viewer_id IS NULL OR p_username IS NULL OR pg_catalog.length(pg_catalog.btrim(p_username)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.avatar_path,
    p.avatar_url,
    p.bio,
    p.is_private
  FROM public.profiles p
  WHERE pg_catalog.lower(p.username) = pg_catalog.lower(p_username)
    AND COALESCE(p.is_deleted, false) = false
    AND p.deleted_at IS NULL
    AND p.locked_for_deletion = false
    AND NOT public.is_blocked_either_way(v_viewer_id, p.id)
    AND (
      COALESCE(p.is_private, false) = false
      OR p.id = v_viewer_id
      OR public.is_following(v_viewer_id, p.id)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_profile_for_profile_page(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_profile_for_profile_page(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_profile_for_profile_page(text) TO authenticated;

-- Verification / Evidence (run manually; save output under:
-- docs/version5/hardening/surfaces/settings-profile/evidence/sql/)
-- select n.nspname as schema_name,
--        p.proname,
--        pg_get_function_identity_arguments(p.oid) as identity_args,
--        p.prosecdef,
--        (
--          select regexp_replace(cfg, '^search_path=', '')
--          from unnest(p.proconfig) cfg
--          where cfg like 'search_path=%'
--          limit 1
--        ) as search_path_value,
--        p.proconfig
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname = 'get_profile_for_profile_page';
--
-- select routine_schema, routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name = 'get_profile_for_profile_page'
--   and grantee in ('PUBLIC', 'anon', 'authenticated', 'postgres', 'service_role')
-- order by routine_name, grantee;
