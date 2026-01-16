-- 43_RPC_DYNAMIC_SQL_FLAGS.sql
-- Heuristic flags for dynamic SQL usage in exposed-schema functions.
with settings as (
  select
    nullif(current_setting('pgrst.db_schemas', true), '') as db_schemas
),
exposed_schemas as (
  select
    trim(s) as schema_name
  from settings,
       unnest(string_to_array(coalesce(db_schemas, ''), ',')) as s
  where s is not null and s <> ''
),
functions as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    lower(pg_get_functiondef(p.oid)) as function_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join exposed_schemas s on s.schema_name = n.nspname
  where p.prokind in ('f','p')
)
select
  schema_name,
  function_name,
  identity_args,
  (function_def like '%execute %' or function_def like '%execute(%') as has_execute,
  (function_def like '%format(%') as has_format,
  (function_def like '%quote_ident(%' or function_def like '%quote_literal(%') as has_quote,
  ((function_def like '%execute %' or function_def like '%execute(%') or (function_def like '%format(%')) as dynamic_sql_flag
from functions
order by schema_name, function_name, identity_args;
