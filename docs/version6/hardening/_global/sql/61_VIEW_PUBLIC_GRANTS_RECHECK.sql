-- 61_VIEW_PUBLIC_GRANTS_RECHECK.sql
-- Public view grant + security_invoker posture recheck (0 rows = PASS).
with public_views as (
  select
    n.nspname as schema_name,
    c.relname as view_name,
    c.relkind,
    (
      (coalesce(c.reloptions, '{}'::text[]) @> array['security_invoker=true'])
      or (coalesce(c.reloptions, '{}'::text[]) @> array['security_invoker=on'])
    ) as security_invoker
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'v'
),
view_grants as (
  select
    tp.table_schema as schema_name,
    tp.table_name as view_name,
    tp.grantee,
    tp.privilege_type
  from information_schema.table_privileges tp
  where tp.table_schema = 'public'
    and tp.grantee in ('PUBLIC', 'anon', 'authenticated')
),
joined as (
  select
    v.schema_name,
    v.view_name,
    v.relkind,
    v.security_invoker,
    g.grantee,
    g.privilege_type
  from public_views v
  join view_grants g
    on g.schema_name = v.schema_name
   and g.view_name = v.view_name
)
select
  schema_name,
  view_name,
  relkind,
  security_invoker,
  grantee,
  privilege_type,
  case
    when privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER') then
      'GATE_VIEW_DML_GRANT'
    when privilege_type = 'SELECT' and security_invoker = false then
      'GATE_VIEW_SELECT_NO_SECURITY_INVOKER'
    else
      'GATE_UNKNOWN'
  end as gate_id
from joined
where privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
   or (privilege_type = 'SELECT' and security_invoker = false)
order by schema_name, view_name, grantee, privilege_type;
