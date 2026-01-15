-- 63_RLS_DISABLED_EXPOSED_RECHECK.sql
-- Recheck for exposed tables with RLS disabled (public-only scope; 0 rows = PASS).
with in_scope_schemas as (
  select 'public'::text as schema_name
),
in_scope_tables as (
  select
    n.nspname as schema_name,
    c.relname as table_name,
    c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join in_scope_schemas s on s.schema_name = n.nspname
  where c.relkind in ('r','p')
)
select
  t.schema_name,
  t.table_name,
  g.grantee,
  g.privilege_type,
  'GATE_RLS_DISABLED_EXPOSED' as gate_id
from in_scope_tables t
join information_schema.table_privileges g
  on g.table_schema = t.schema_name
 and g.table_name = t.table_name
where t.relrowsecurity = false
  and g.grantee in ('PUBLIC','anon','authenticated')
order by t.schema_name, t.table_name, g.grantee, g.privilege_type;
