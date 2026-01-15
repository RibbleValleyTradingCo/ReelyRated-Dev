-- 45_RPC_DEPENDENCIES.sql
-- Best-effort mapping of function usage in policies, views, and triggers (substring match).
with in_scope_schemas as (
  -- v0 scope: app-owned schema(s) only
  select 'public'::text as schema_name
),
functions as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join in_scope_schemas s on s.schema_name = n.nspname
  where p.prokind in ('f','p')
),
policy_texts as (
  select lower(coalesce(qual,'') || ' ' || coalesce(with_check,'')) as policy_text
  from pg_policies
  where schemaname in (select schema_name from in_scope_schemas)
),
view_texts as (
  select lower(pg_get_viewdef((n.nspname || '.' || c.relname)::regclass, true)) as view_text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in (select schema_name from in_scope_schemas)
    and c.relkind in ('v','m')
),
deps as (
  select
    f.schema_name,
    f.function_name,
    f.identity_args,
    exists (
      select 1
      from policy_texts pt
      where pt.policy_text like '%' || lower(f.function_name) || '%'
    ) as referenced_in_policies,
    exists (
      select 1
      from view_texts vt
      where vt.view_text like '%' || lower(f.function_name) || '%'
    ) as referenced_in_views,
    exists (
      select 1
      from pg_trigger t
      where t.tgfoid = f.oid
        and not t.tgisinternal
    ) as referenced_in_triggers
  from functions f
)
select
  schema_name,
  function_name,
  identity_args,
  referenced_in_policies,
  referenced_in_views,
  referenced_in_triggers
from deps
order by schema_name, function_name, identity_args;
