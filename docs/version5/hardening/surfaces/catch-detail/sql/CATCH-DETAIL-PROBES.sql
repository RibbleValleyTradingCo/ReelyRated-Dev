-- CATCH-DETAIL-PROBES.sql
-- Probe pack for /catch/:id surface (catch-detail).
--
-- Evidence output instructions:
-- - Save outputs under: docs/version5/hardening/surfaces/catch-detail/evidence/sql/
-- - Suggested filenames:
--   - SQL_catch-detail_probes_YYYY-MM-DD.txt (copy/paste output)
--   - SQL_catch-detail_rpc-posture_YYYY-MM-DD.csv (if exporting RPC posture)
--
-- Scope: Only objects used by /catch/:id entrypoints.

-- ------------------------------------------------------------
-- A) Grants snapshot (PostgREST tables/views touched)
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
    'catches',
    'catch_reactions',
    'profile_follows',
    'admin_users',
    'catch_comments_with_admin',
    'catch_mention_candidates'
  )
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- ------------------------------------------------------------
-- B) RLS posture + policies (tables touched by Data API / RPCs)
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
    'catches',
    'catch_reactions',
    'profile_follows',
    'admin_users',
    'catch_comments'
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
    'catches',
    'catch_reactions',
    'profile_follows',
    'admin_users',
    'catch_comments'
  )
order by tablename, policyname;

-- ------------------------------------------------------------
-- C) View posture (security_invoker / owner / reloptions)
-- ------------------------------------------------------------
select
  n.nspname as schema_name,
  c.relname as view_name,
  c.relkind,
  c.relowner::regrole as owner_role,
  c.relrowsecurity,
  c.relforcerowsecurity,
  c.reloptions,
  (coalesce(c.reloptions, '{}'::text[]) @> array['security_invoker=true']) as security_invoker
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('catch_comments_with_admin', 'catch_mention_candidates')
  and c.relkind = 'v'
order by c.relname;

-- ------------------------------------------------------------
-- D) RPC posture (SECURITY DEFINER, search_path, EXECUTE grants)
-- ------------------------------------------------------------
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
    'get_catch_rating_summary',
    'react_to_catch_with_rate_limit',
    'follow_profile_with_rate_limit',
    'rate_catch_with_rate_limit',
    'create_comment_with_rate_limit',
    'soft_delete_comment',
    'create_notification'
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
    'get_catch_rating_summary',
    'react_to_catch_with_rate_limit',
    'follow_profile_with_rate_limit',
    'rate_catch_with_rate_limit',
    'create_comment_with_rate_limit',
    'soft_delete_comment',
    'create_notification'
  )
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by routine_name, grantee, privilege_type;

-- ------------------------------------------------------------
-- E) Persona intent checks (output-only guidance)
-- ------------------------------------------------------------
-- Expected EXECUTE grants (Path A: auth-only surface; anon redirected to /auth):
-- - anon: NO EXECUTE on any catch-detail RPCs (including get_catch_rating_summary).
-- - authenticated: allowed for catch-detail RPCs (get_catch_rating_summary + react/follow/rate/comment/delete/create_notification).
-- Treat any anon/PUBLIC EXECUTE on ANY of these RPCs as FAIL.
--
-- Expected PostgREST grants:
-- - anon: no DELETE on catch_reactions/profile_follows; no writes on any touched table.
-- - authenticated: DELETE allowed where UI supports it (catch_reactions/profile_follows); other writes via RPCs.
