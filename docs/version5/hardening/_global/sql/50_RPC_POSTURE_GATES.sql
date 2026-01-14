-- 50_RPC_POSTURE_GATES.sql
-- Gate-style failures for RPC posture (0 rows = PASS per gate).
with allowlist_public as (
  -- RPCs intentionally callable by PUBLIC/anon (update as needed)
  select * from (values
    ('public', 'get_community_stats')
  ) as t(schema_name, function_name)
),
allowlist_anon as (
  select * from (values
    ('public', 'get_community_stats')
  ) as t(schema_name, function_name)
),
in_scope_schemas as (
  -- v0 scope: app-owned schema(s) only
  select 'public'::text as schema_name
),
functions as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.prosecdef as is_security_definer,
    p.proconfig,
    p.proowner,
    p.proacl,
    p.oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join in_scope_schemas s on s.schema_name = n.nspname
  where p.prokind in ('f','p')
),
function_flags as (
  select
    f.schema_name,
    f.function_name,
    f.identity_args,
    f.is_security_definer,
    exists (
      select 1
      from unnest(f.proconfig) cfg
      where cfg like 'search_path=%'
    ) as search_path_pinned,
    f.oid
  from functions f
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
dependency_flags as (
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
  from function_flags f
),
target_grantees as (
  select r.oid, r.rolname
  from pg_roles r
  where r.rolname in ('anon')
  union all
  select 0::oid as oid, 'PUBLIC'::text as rolname
),
exec_grants as (
  select
    f.schema_name,
    f.function_name,
    f.identity_args,
    tg.rolname as grantee,
    ax.privilege_type
  from functions f
  cross join lateral aclexplode(
    coalesce(f.proacl, acldefault('f', f.proowner))
  ) ax
  join target_grantees tg on tg.oid = ax.grantee
  where ax.privilege_type = 'EXECUTE'
),
gate_rows as (
  select
    case
      when e.grantee = 'PUBLIC' then 'GATE_PUBLIC_EXECUTE_NOT_ALLOWLISTED'
      else 'GATE_ANON_EXECUTE_NOT_ALLOWLISTED'
    end as gate_id,
    e.schema_name,
    e.function_name,
    e.identity_args,
    e.grantee,
    f.is_security_definer,
    f.search_path_pinned,
    d.referenced_in_policies,
    d.referenced_in_views,
    d.referenced_in_triggers
  from exec_grants e
  join function_flags f
    on f.schema_name = e.schema_name
   and f.function_name = e.function_name
   and f.identity_args = e.identity_args
  join dependency_flags d
    on d.schema_name = e.schema_name
   and d.function_name = e.function_name
   and d.identity_args = e.identity_args
  left join allowlist_public ap
    on ap.schema_name = e.schema_name and ap.function_name = e.function_name
  left join allowlist_anon aa
    on aa.schema_name = e.schema_name and aa.function_name = e.function_name
  where (e.grantee = 'PUBLIC' and ap.function_name is null)
     or (e.grantee = 'anon' and aa.function_name is null)
)
select distinct
  gate_id,
  schema_name,
  function_name,
  identity_args,
  grantee,
  is_security_definer,
  search_path_pinned,
  referenced_in_policies,
  referenced_in_views,
  referenced_in_triggers
from gate_rows
order by gate_id, schema_name, function_name, identity_args, grantee;
