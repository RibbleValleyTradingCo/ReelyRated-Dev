-- PROFILE-SETTINGS-PROBES.sql
-- Probe pack for /settings/profile (Profile Settings surface).
--
-- Evidence output instructions:
-- - Save outputs under: docs/version5/hardening/surfaces/settings-profile/evidence/sql/
-- - Suggested filenames:
--   - SQL_profile-settings_grants_YYYY-MM-DD.txt
--   - SQL_profile-settings_rls_policies_YYYY-MM-DD.txt
--   - SQL_profile-settings_rpc_posture_YYYY-MM-DD.txt
--   - SQL_profile-settings_routine_privileges_YYYY-MM-DD.txt
--   - SQL_profile-settings_storage_policies_YYYY-MM-DD.txt
--   - SQL_profile-settings_storage_objects_sample_YYYY-MM-DD.txt
--
-- Scope: Only objects used by /settings/profile entrypoints.

-- ------------------------------------------------------------
-- A) Grants snapshot (PostgREST tables touched)
-- ------------------------------------------------------------
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'profiles',
    'profile_blocks',
    'admin_users'
  )
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- ------------------------------------------------------------
-- B) RLS posture + policies (tables touched by Data API)
-- ------------------------------------------------------------
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relkind,
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'profile_blocks',
    'admin_users'
  )
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  roles,
  permissive,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_blocks',
    'admin_users'
  )
order by tablename, policyname;

-- ------------------------------------------------------------
-- C) RPC posture (SECURITY DEFINER, search_path, EXECUTE grants)
-- ------------------------------------------------------------
-- If any of these return 0 rows, treat as "not found" and verify in DB.
select
  n.nspname as schema_name,
  p.proname,
  p.oid,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.prosecdef as is_security_definer,
  p.proconfig,
  r.rolname as owner_role,
  p.proacl,
  (
    select regexp_replace(cfg, '^search_path=', '')
    from unnest(p.proconfig) cfg
    where cfg like 'search_path=%'
    limit 1
  ) as search_path_value,
  (
    select cfg is not null
    from unnest(p.proconfig) cfg
    where cfg like 'search_path=%'
    limit 1
  ) as search_path_pinned
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join pg_roles r on r.oid = p.proowner
where n.nspname = 'public'
  and p.proname in (
    'request_account_export',
    'request_account_deletion',
    'unblock_profile'
  )
order by p.proname, identity_args;

select
  routine_schema,
  routine_name,
  specific_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'request_account_export',
    'request_account_deletion',
    'unblock_profile'
  )
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'postgres', 'service_role')
order by routine_name, grantee, privilege_type;

-- Expected EXECUTE grants (persona intent):
-- - anon: no EXECUTE on these RPCs.
-- - authenticated: EXECUTE allowed for request_account_export, request_account_deletion, unblock_profile.
-- Any PUBLIC/anon EXECUTE should be treated as FAIL.

-- ------------------------------------------------------------
-- D) Storage policy posture (avatars bucket)
-- ------------------------------------------------------------
select
  pol.polname as policyname,
  pol.polcmd,
  pol.polroles::regrole[] as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as qual,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects'
order by pol.polname;

-- PROFILE-SETTINGS-PROBES-AVATARS-ONLY:START
-- Focused policy view for the avatars bucket:
-- (We still keep the full policy listing above, but this makes review faster.)
select
  pol.polname as policyname,
  pol.polcmd,
  pol.polroles::regrole[] as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as qual,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects'
  and (
    coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%avatars%'
    or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%avatars%'
    or coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%bucket_id%'
    or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%bucket_id%'
  )
order by pol.polname;
-- PROFILE-SETTINGS-PROBES-AVATARS-ONLY:END

select
  bucket_id,
  name,
  owner,
  owner_id,
  created_at
from storage.objects
where bucket_id = 'avatars'
order by created_at desc
limit 10;

-- Note: Supabase tracks ownership via owner_id (JWT sub). Dashboard/service inserts may not set it.
