-- 30_RLS_POLICIES.sql
-- Full policy dump for non-system schemas.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname not like 'pg_%'
  and schemaname <> 'information_schema'
order by schemaname, tablename, policyname;
