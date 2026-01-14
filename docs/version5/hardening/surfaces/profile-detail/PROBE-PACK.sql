-- PROFILE-DETAIL PROBE PACK (read-only)
-- Surface: /profile/:slug/* (auth-only)
-- Intended runner: postgres/admin in Supabase SQL editor.
-- Save outputs under: docs/version5/hardening/surfaces/profile-detail/evidence/sql/

-- ------------------------------------------------------------
-- 0) Metadata (context snapshot)
-- EXPECTED PASS: returns current session metadata for traceability.
-- ------------------------------------------------------------
select
  now() as captured_at,
  current_user as current_user,
  session_user as session_user,
  current_database() as database_name,
  current_setting('role', true) as role_setting,
  current_setting('search_path', true) as search_path_setting;

-- ------------------------------------------------------------
-- 1) Surface entrypoints inventory (DB objects)
-- EXPECTED PASS: lists the objects below if they exist in the schema.
-- ------------------------------------------------------------
-- Tables / views touched by this surface:
select
  n.nspname as schema_name,
  c.relname as object_name,
  c.relkind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
order by c.relname;

-- RPCs used by this surface:
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.prokind
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  )
order by p.proname, identity_args;

-- ------------------------------------------------------------
-- 2) RLS posture (must be enabled) + policies
-- EXPECTED PASS: relrowsecurity=true on exposed tables; policies exist.
-- ------------------------------------------------------------
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
order by tablename, policyname;

-- RLS mismatch sanity checks
-- EXPECTED PASS: 0 rows for either query below.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
  and c.relrowsecurity = true
  and not exists (
    select 1
    from pg_policies p
    where p.schemaname = n.nspname
      and p.tablename = c.relname
  )
order by c.relname;

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
  and c.relrowsecurity = false
  and exists (
    select 1
    from pg_policies p
    where p.schemaname = n.nspname
      and p.tablename = c.relname
  )
order by c.relname;

-- ------------------------------------------------------------
-- 3) Grants posture (least privilege)
-- EXPECTED PASS: no anon/PUBLIC DML on RPC-only tables; auth-only surface.
-- ------------------------------------------------------------
select
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- ------------------------------------------------------------
-- 4) RPC EXECUTE allowlist proof (auth-only vs public-safe)
-- EXPECTED PASS: auth-only RPCs not executable by PUBLIC/anon.
-- ------------------------------------------------------------
select
  routine_name,
  specific_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  )
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role', 'postgres')
order by routine_name, grantee;

select
  n.nspname as schema_name,
  p.proname as routine_name,
  p.oid::regprocedure as signature,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  )
order by p.proname, signature;

-- has_function_privilege checks (auth-only RPCs should be false for anon)
select
  p.proname as routine_name,
  p.oid::regprocedure as signature,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  )
order by p.proname, signature;

-- ------------------------------------------------------------
-- 5) SECURITY DEFINER + search_path hygiene
-- EXPECTED PASS: SECURITY DEFINER functions have pinned search_path where required.
-- ------------------------------------------------------------
select
  n.nspname as schema_name,
  p.proname as routine_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.prosecdef as is_security_definer,
  p.proowner::regrole as owner_role,
  (
    select regexp_replace(cfg, '^search_path=', '')
    from unnest(p.proconfig) cfg
    where cfg like 'search_path=%'
    limit 1
  ) as search_path_value,
  p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  )
order by p.proname, identity_args;

-- FAILURES: SECURITY DEFINER functions missing pinned search_path
-- EXPECTED PASS: 0 rows.
select
  n.nspname as schema_name,
  p.proname as routine_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.prosecdef as is_security_definer,
  sp.search_path_value
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join lateral (
  select regexp_replace(cfg, '^search_path=', '') as search_path_value
  from unnest(p.proconfig) cfg
  where cfg like 'search_path=%'
  limit 1
) sp on true
where n.nspname = 'public'
  and p.proname in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  )
  and p.prosecdef = true
  and (
    sp.search_path_value is null
    or sp.search_path_value = ''
    or sp.search_path_value = '""'
  )
order by p.proname, identity_args;

-- ------------------------------------------------------------
-- 6) View security (if any views are used by this surface)
-- EXPECTED PASS: if views exist here, security_invoker should be true or access is tightly scoped.
-- ------------------------------------------------------------
select
  n.nspname as schema_name,
  c.relname as view_name,
  c.relkind,
  c.relowner::regrole as owner_role,
  c.reloptions,
  (
    coalesce(c.reloptions, '{}'::text[]) @> array['security_invoker=true']
    or coalesce(c.reloptions, '{}'::text[]) @> array['security_invoker=on']
  ) as security_invoker
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('v', 'm')
order by c.relname;

-- ------------------------------------------------------------
-- 7) Column privileges (sensitive tables)
-- EXPECTED PASS: no unexpected column-level grants to PUBLIC/anon.
-- ------------------------------------------------------------
select
  table_name,
  column_name,
  grantee,
  privilege_type
from information_schema.role_column_grants
where table_schema = 'public'
  and table_name in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_name, column_name, grantee, privilege_type;

-- ------------------------------------------------------------
-- 8) IDOR risk indicators (static DB indicators)
-- EXPECTED PASS: no permissive SELECT/UPDATE/DELETE policies for PUBLIC/anon on auth-only objects.
-- ------------------------------------------------------------
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
  and cmd in ('SELECT', 'UPDATE', 'DELETE')
  and (
    qual = 'true'
    or qual = '(true)'
    or roles is null
    or roles @> array['anon']::name[]
    or roles @> array['public']::name[]
  )
order by tablename, policyname;

-- INSERT policies should not be broadly permissive for PUBLIC/anon.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
  and cmd = 'INSERT'
  and (
    with_check is null
    or with_check = 'true'
    or with_check = '(true)'
  )
  and (
    roles is null
    or roles @> array['anon']::name[]
    or roles @> array['public']::name[]
  )
order by tablename, policyname;

-- ------------------------------------------------------------
-- 9) Multiple permissive policies
-- EXPECTED PASS: 0 rows for any (table, cmd) with >1 permissive policy.
-- ------------------------------------------------------------
select
  schemaname,
  tablename,
  cmd,
  count(*) as permissive_count
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_follows',
    'profile_blocks',
    'catches',
    'ratings',
    'venues',
    'notifications',
    'admin_users',
    'rate_limits'
  )
  and permissive = 'PERMISSIVE'
group by schemaname, tablename, cmd
having count(*) > 1
order by tablename, cmd;

-- ------------------------------------------------------------
-- 10) Storage policy posture (optional; profile media / avatars)
-- EXPECTED PASS: policies should be bucket-scoped and owner-scoped.
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
  and (
    coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%avatar%'
    or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%avatar%'
    or pol.polname ilike '%avatar%'
  )
order by pol.polname;

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
  and c.relname = 'buckets'
  and (
    coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%avatar%'
    or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%avatar%'
    or pol.polname ilike '%avatar%'
  )
order by pol.polname;

select
  id,
  name,
  public
from storage.buckets
where name ilike '%avatar%'
order by name;

select
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'get_profile_for_profile_page',
    'get_follower_count',
    'follow_profile_with_rate_limit',
    'block_profile',
    'unblock_profile',
    'create_notification'
  )
  and grantee in ('PUBLIC', 'anon')
order by routine_name, grantee;
