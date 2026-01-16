-- 41_EXPOSED_SCHEMAS.sql
-- Exposed schema set from PostgREST settings + schema USAGE checks (read-only).
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
schemas_raw as (
  select
    trim(s) as schema_name,
    'db_schemas'::text as source
  from effective,
       unnest(string_to_array(coalesce(db_schemas_effective, ''), ',')) as s
  where s is not null and s <> ''

  union all

  select
    trim(s) as schema_name,
    'db_extra_search_path'::text as source
  from effective,
       unnest(string_to_array(coalesce(db_extra_search_path_effective, ''), ',')) as s
  where s is not null and s <> ''
),
schemas as (
  select
    schema_name,
    bool_or(source = 'db_schemas') as in_db_schemas,
    bool_or(source = 'db_extra_search_path') as in_db_extra_search_path
  from schemas_raw
  group by schema_name
)
select
  schema_name,
  in_db_schemas as exposed_schema,
  in_db_extra_search_path,
  has_schema_privilege('anon', schema_name, 'USAGE') as anon_schema_usage,
  has_schema_privilege('authenticated', schema_name, 'USAGE') as authenticated_schema_usage
from schemas
order by schema_name;
