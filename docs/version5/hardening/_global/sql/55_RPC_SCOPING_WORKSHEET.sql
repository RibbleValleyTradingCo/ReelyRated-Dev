-- 55_RPC_SCOPING_WORKSHEET.sql
-- Joined scoping worksheet for RPC allowlisting decisions.
-- Precedence: internal > admin_ > owner_ > helpers > public_read > auth_rpc > other.
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
    p.proowner,
    p.proacl,
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
  from functions f
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
    tg.rolname as grantee
  from functions f
  cross join lateral aclexplode(
    coalesce(f.proacl, acldefault('f', f.proowner))
  ) ax
  join target_grantees tg on tg.oid = ax.grantee
  where ax.privilege_type = 'EXECUTE'
),
exec_non_allowlisted as (
  select
    e.schema_name,
    e.function_name,
    e.identity_args,
    e.grantee
  from exec_grants e
  left join allowlist_public ap
    on ap.schema_name = e.schema_name and ap.function_name = e.function_name
  left join allowlist_anon aa
    on aa.schema_name = e.schema_name and aa.function_name = e.function_name
  where (e.grantee = 'PUBLIC' and ap.function_name is null)
     or (e.grantee = 'anon' and aa.function_name is null)
),
gate_flags as (
  select
    f.schema_name,
    f.function_name,
    f.identity_args,
    (max(case when e.grantee = 'PUBLIC' then 1 else 0 end) > 0) as gate_public_execute,
    (max(case when e.grantee = 'anon' then 1 else 0 end) > 0) as gate_anon_execute
  from functions f
  left join exec_non_allowlisted e
    on e.schema_name = f.schema_name
   and e.function_name = f.function_name
   and e.identity_args = f.identity_args
  group by f.schema_name, f.function_name, f.identity_args
)
select
  case
    when coalesce(d.referenced_in_triggers, false) or coalesce(d.referenced_in_policies, false) then 'internal'
    when f.function_name like 'admin_%' then 'admin_'
    when f.function_name like 'owner_%' then 'owner_'
    when f.function_name in (
      'is_admin',
      'is_following',
      'is_blocked_either_way',
      'is_venue_admin_or_owner'
    ) then 'helpers'
    when f.function_name like 'get_%'
      or f.function_name in (
        'get_community_stats',
        'get_species_options',
        'get_venues',
        'get_venue_by_slug'
      ) then 'public_read'
    when f.function_name like '%_with_rate_limit'
      or f.function_name in (
        'block_profile',
        'unblock_profile',
        'request_account_deletion',
        'request_account_export'
      ) then 'auth_rpc'
    else 'other'
  end as bucket,
  f.schema_name,
  f.function_name,
  f.identity_args,
  coalesce(g.gate_public_execute, false) as gate_public_execute,
  coalesce(g.gate_anon_execute, false) as gate_anon_execute,
  coalesce(d.referenced_in_policies, false) as referenced_in_policies,
  coalesce(d.referenced_in_views, false) as referenced_in_views,
  coalesce(d.referenced_in_triggers, false) as referenced_in_triggers
from functions f
left join gate_flags g
  on g.schema_name = f.schema_name
 and g.function_name = f.function_name
 and g.identity_args = f.identity_args
left join dependency_flags d
  on d.schema_name = f.schema_name
 and d.function_name = f.function_name
 and d.identity_args = f.identity_args
order by bucket, schema_name, function_name, identity_args;
