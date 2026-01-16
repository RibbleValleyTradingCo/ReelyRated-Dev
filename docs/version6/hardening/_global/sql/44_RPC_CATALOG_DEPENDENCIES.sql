-- 44_RPC_CATALOG_DEPENDENCIES.sql
-- Direct dependencies from pg_depend for exposed-schema functions.
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
functions as (
  select
    p.oid as func_oid,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join exposed_schemas s on s.schema_name = n.nspname
  where p.prokind in ('f','p')
),
deps as (
  select
    f.schema_name,
    f.function_name,
    f.identity_args,
    case
      when d.refclassid = 'pg_class'::regclass then 'relation'
      when d.refclassid = 'pg_proc'::regclass then 'function'
      when d.refclassid = 'pg_type'::regclass then 'type'
      else d.refclassid::regclass::text
    end as dependency_type,
    case
      when d.refclassid = 'pg_class'::regclass then cn.nspname
      when d.refclassid = 'pg_proc'::regclass then pn.nspname
      when d.refclassid = 'pg_type'::regclass then tn.nspname
      else null::text
    end as dependency_schema,
    case
      when d.refclassid = 'pg_class'::regclass then c.relname
      when d.refclassid = 'pg_proc'::regclass then p2.proname
      when d.refclassid = 'pg_type'::regclass then t.typname
      else null::text
    end as dependency_name,
    case
      when d.refclassid = 'pg_class'::regclass then c.relkind::text
      else null::text
    end as dependency_relkind
  from functions f
  join pg_depend d on d.objid = f.func_oid
  left join pg_class c
    on d.refclassid = 'pg_class'::regclass
   and d.refobjid = c.oid
  left join pg_namespace cn on cn.oid = c.relnamespace
  left join pg_proc p2
    on d.refclassid = 'pg_proc'::regclass
   and d.refobjid = p2.oid
  left join pg_namespace pn on pn.oid = p2.pronamespace
  left join pg_type t
    on d.refclassid = 'pg_type'::regclass
   and d.refobjid = t.oid
  left join pg_namespace tn on tn.oid = t.typnamespace
)
select
  schema_name,
  function_name,
  identity_args,
  dependency_type,
  dependency_schema,
  dependency_name,
  dependency_relkind
from deps
where dependency_name is not null
order by schema_name, function_name, identity_args, dependency_type, dependency_schema, dependency_name;
