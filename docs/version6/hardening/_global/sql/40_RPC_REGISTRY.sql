-- 40_RPC_REGISTRY.sql
-- RPC inventory + EXECUTE grants (single result set).
with target_schemas as (
  select n.oid as nsp_oid, n.nspname as schema_name
  from pg_namespace n
  where n.nspname not like 'pg_%'
    and n.nspname <> 'information_schema'
),
functions as (
  select
    n.schema_name as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.prokind,
    p.prosecdef as is_security_definer,
    p.proowner::regrole as owner_role,
    l.lanname as language,
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
  join target_schemas n on n.nsp_oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  where p.prokind in ('f','p')
),
exec_grants as (
  select
    r.specific_schema as schema_name,
    r.routine_name as function_name,
    r.specific_name,
    r.grantee,
    r.privilege_type
  from information_schema.routine_privileges r
  where r.specific_schema in (select schema_name from target_schemas)
    and r.grantee in ('PUBLIC','anon','authenticated','service_role','postgres')
),
registry as (
  select
    'function' as record_type,
    f.schema_name,
    f.function_name,
    f.identity_args,
    f.prokind::text as prokind,
    f.is_security_definer,
    f.owner_role::text as owner_role,
    f.language::text as language,
    f.search_path_value,
    f.search_path_pinned,
    f.proacl::text as proacl_text,
    null::text as grantee,
    null::text as privilege_type
  from functions f
),
execs as (
  select
    'execute_grant' as record_type,
    e.schema_name,
    e.function_name,
    null::text as identity_args,
    null::text as prokind,
    null::boolean as is_security_definer,
    null::text as owner_role,
    null::text as language,
    null::text as search_path_value,
    null::boolean as search_path_pinned,
    null::text as proacl_text,
    e.grantee,
    e.privilege_type
  from exec_grants e
)
select * from registry
union all
select * from execs
order by record_type, schema_name, function_name, identity_args nulls last, grantee nulls last, privilege_type nulls last;
