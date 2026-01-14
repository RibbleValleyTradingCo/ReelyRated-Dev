-- ⚠️ LEGACY (archived 2026-01-13)
-- Preserved v1 global probe/notes for audit/history.
-- Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
-- Do not modify semantics here; only edit if fixing broken internal legacy links/comments.

-- RPC-POSTURE-LIVE.sql
-- Live posture snapshot for functions in target schemas, including definer/invoker and search_path config.

with target_schemas as (
  select 'public' as schema_name
),
funcs as (
  select
    n.nspname as schema_name,
    p.proname,
    p.oid,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.prokind,
    p.prosecdef,
    p.proowner,
    p.proacl,
    p.proconfig
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join target_schemas ts on ts.schema_name = n.nspname
),
owners as (
  select oid, rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
  from pg_roles
)
select
  f.schema_name,
  f.proname,
  f.oid,
  f.identity_args,
  f.prokind,
  f.prosecdef,
  o.rolname as owner,
  f.proacl,
  f.proconfig,
  (sp.search_path_value is not null) as search_path_pinned,
  sp.search_path_value,
  o.rolsuper,
  o.rolcreaterole,
  o.rolcreatedb,
  o.rolbypassrls
from funcs f
join owners o on o.oid = f.proowner
left join lateral (
  select split_part(conf, '=', 2) as search_path_value
  from unnest(f.proconfig) conf
  where conf like 'search_path=%'
  limit 1
) sp on true
order by f.schema_name, f.proname, f.identity_args;
