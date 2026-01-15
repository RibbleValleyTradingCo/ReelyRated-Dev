-- 66_UID_INITPLAN_CANDIDATES.sql
-- Policies in public schema that call uid() / is_admin(uid()) without initplan-safe wrapping.
with policies as (
  select
    p.schemaname,
    p.tablename,
    p.cmd,
    p.roles,
    p.policyname,
    p.permissive,
    p.qual,
    p.with_check,
    lower(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) as expr
  from pg_policies p
  where p.schemaname = 'public'
)
select
  tablename,
  cmd,
  policyname,
  permissive,
  roles,
  (expr like '%(select uid())%') as already_initplan_safe,
  qual,
  with_check
from policies
where (expr like '%uid()%' or expr like '%is_admin(uid())%')
  and expr not like '%(select uid())%'
order by tablename, policyname, cmd;
