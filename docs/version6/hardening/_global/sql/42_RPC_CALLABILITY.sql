-- 42_RPC_CALLABILITY.sql
-- Client-callable RPC posture for exposed schemas (read-only, deterministic).
with settings as (
  select
    nullif(current_setting('pgrst.db_schemas', true), '') as db_schemas,
    nullif(current_setting('pgrst.db_extra_search_path', true), '') as db_extra_search_path,
    nullif(:'EXPOSED_SCHEMAS', '') as fallback_schemas,
    nullif(:'EXTRA_SEARCH_PATH', '') as fallback_extra_search_path
),
effective as (
  select
    coalesce(db_schemas, fallback_schemas) as db_schemas_effective,
    coalesce(db_extra_search_path, fallback_extra_search_path) as db_extra_search_path_effective
  from settings
),
exposed_schemas as (
  select
    trim(s) as schema_name
  from effective,
       unnest(string_to_array(coalesce(db_schemas_effective, ''), ',')) as s
  where s is not null and s <> ''
),
roles as (
  select
    (select oid from pg_roles where rolname = 'anon') as anon_oid,
    (select oid from pg_roles where rolname = 'authenticated') as authenticated_oid
),
functions as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.oid::regprocedure::text as regprocedure,
    pg_get_function_result(p.oid) as return_type,
    p.prokind::text as prokind,
    p.prosecdef as is_security_definer,
    p.proowner::regrole as owner_role,
    p.proacl,
    p.proowner,
    (
      select regexp_replace(cfg, '^search_path=', '')
      from unnest(p.proconfig) cfg
      where cfg like 'search_path=%'
      limit 1
    ) as search_path_value,
    exists (
      select 1
      from unnest(p.proconfig) cfg
      where cfg like 'search_path=%'
    ) as search_path_pinned
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join exposed_schemas s on s.schema_name = n.nspname
  where p.prokind in ('f','p')
),
overloads as (
  select
    schema_name,
    function_name,
    count(*) as overload_count
  from functions
  group by schema_name, function_name
),
exec_grants as (
  select
    f.schema_name,
    f.function_name,
    f.identity_args,
    f.regprocedure,
    f.return_type,
    f.prokind,
    f.is_security_definer,
    f.owner_role,
    f.search_path_value,
    f.search_path_pinned,
    bool_or(ax.privilege_type = 'EXECUTE' and ax.grantee = 0::oid) as exec_public,
    bool_or(ax.privilege_type = 'EXECUTE' and ax.grantee = r.anon_oid) as exec_anon,
    bool_or(ax.privilege_type = 'EXECUTE' and ax.grantee = r.authenticated_oid) as exec_authenticated
  from functions f
  cross join roles r
  cross join lateral aclexplode(
    coalesce(f.proacl, acldefault('f', f.proowner))
  ) ax
  group by
    f.schema_name,
    f.function_name,
    f.identity_args,
    f.regprocedure,
    f.return_type,
    f.prokind,
    f.is_security_definer,
    f.owner_role,
    f.search_path_value,
    f.search_path_pinned
)
select
  e.schema_name,
  e.function_name,
  e.identity_args,
  e.regprocedure,
  e.return_type,
  e.prokind,
  e.is_security_definer,
  e.owner_role,
  e.search_path_value,
  e.search_path_pinned,
  true as schema_exposed,
  has_schema_privilege('anon', e.schema_name, 'USAGE') as anon_schema_usage,
  has_schema_privilege('authenticated', e.schema_name, 'USAGE') as authenticated_schema_usage,
  e.exec_public,
  e.exec_anon,
  e.exec_authenticated,
  (has_schema_privilege('anon', e.schema_name, 'USAGE') and (e.exec_public or e.exec_anon)) as callable_by_anon,
  (has_schema_privilege('authenticated', e.schema_name, 'USAGE') and (e.exec_public or e.exec_authenticated)) as callable_by_authenticated,
  (o.overload_count > 1) as overload_ambiguous
from exec_grants e
join overloads o
  on o.schema_name = e.schema_name
 and o.function_name = e.function_name
order by e.schema_name, e.function_name, e.identity_args;
