-- 60_VIEW_SECURITY_POSTURE.sql
-- View posture + grants + dependencies (single result set).
with view_list as (
  select
    n.nspname as schema_name,
    c.relname as view_name,
    c.relkind,
    c.relowner::regrole as owner_role,
    c.reloptions
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('v','m')
),
view_posture as (
  select
    'view_posture' as record_type,
    v.schema_name,
    v.view_name,
    v.relkind::text as relkind,
    v.owner_role,
    (coalesce(v.reloptions,'{}'::text[]) @> array['security_invoker=true'])
      or (coalesce(v.reloptions,'{}'::text[]) @> array['security_invoker=on']) as security_invoker,
    v.reloptions::text as reloptions_text,
    null::text as grantee,
    null::text as privilege_type,
    null::text as definition,
    null::text as table_schema,
    null::text as table_name
  from view_list v
),
view_grants as (
  select
    'view_grants' as record_type,
    v.schema_name,
    v.view_name,
    v.relkind::text as relkind,
    v.owner_role,
    null::boolean as security_invoker,
    v.reloptions::text as reloptions_text,
    tp.grantee,
    tp.privilege_type,
    null::text as definition,
    null::text as table_schema,
    null::text as table_name
  from view_list v
  join information_schema.table_privileges tp
    on tp.table_schema = v.schema_name
   and tp.table_name = v.view_name
  where tp.grantee in ('PUBLIC','anon','authenticated')
),
view_defs as (
  select
    'view_def' as record_type,
    v.schema_name,
    v.view_name,
    v.relkind::text as relkind,
    v.owner_role,
    null::boolean as security_invoker,
    v.reloptions::text as reloptions_text,
    null::text as grantee,
    null::text as privilege_type,
    pg_get_viewdef((v.schema_name || '.' || v.view_name)::regclass, true) as definition,
    null::text as table_schema,
    null::text as table_name
  from view_list v
),
view_usage as (
  select
    'view_table_usage' as record_type,
    v.schema_name,
    v.view_name,
    v.relkind::text as relkind,
    v.owner_role,
    null::boolean as security_invoker,
    v.reloptions::text as reloptions_text,
    null::text as grantee,
    null::text as privilege_type,
    null::text as definition,
    u.table_schema,
    u.table_name
  from view_list v
  join information_schema.view_table_usage u
    on u.view_schema = v.schema_name and u.view_name = v.view_name
)
select * from view_posture
union all
select * from view_grants
union all
select * from view_defs
union all
select * from view_usage
order by record_type, schema_name, view_name, grantee nulls last, privilege_type nulls last, table_schema nulls last, table_name nulls last;
