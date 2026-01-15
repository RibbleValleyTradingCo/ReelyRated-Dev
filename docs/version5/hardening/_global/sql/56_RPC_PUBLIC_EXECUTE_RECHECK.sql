-- 56_RPC_PUBLIC_EXECUTE_RECHECK.sql
-- Recheck for non-allowlisted PUBLIC/anon EXECUTE on app RPCs (0 rows = PASS).
with allowlist_public as (
  -- RPCs intentionally callable by PUBLIC/anon (update as needed)
  select * from (values
    ('public', 'get_community_stats'),
    ('public', 'get_feed_catches'),
    ('public', 'get_leaderboard_scores'),
    ('public', 'get_species_options'),
    ('public', 'get_venue_by_slug'),
    ('public', 'get_venue_photos'),
    ('public', 'get_venue_recent_catches'),
    ('public', 'get_venue_past_events'),
    ('public', 'get_venue_top_anglers'),
    ('public', 'get_venue_top_catches'),
    ('public', 'get_venue_upcoming_events'),
    ('public', 'get_venues')
  ) as t(schema_name, function_name)
),
allowlist_anon as (
  select * from (values
    ('public', 'get_community_stats'),
    ('public', 'get_feed_catches'),
    ('public', 'get_leaderboard_scores'),
    ('public', 'get_species_options'),
    ('public', 'get_venue_by_slug'),
    ('public', 'get_venue_photos'),
    ('public', 'get_venue_recent_catches'),
    ('public', 'get_venue_past_events'),
    ('public', 'get_venue_top_anglers'),
    ('public', 'get_venue_top_catches'),
    ('public', 'get_venue_upcoming_events'),
    ('public', 'get_venues')
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
target_grantees as (
  select r.oid, r.rolname
  from pg_roles r
  where r.rolname = 'anon'
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
)
select
  e.schema_name,
  e.function_name,
  e.identity_args,
  case
    when e.grantee = 'PUBLIC' then 'GATE_PUBLIC_EXECUTE_NOT_ALLOWLISTED'
    else 'GATE_ANON_EXECUTE_NOT_ALLOWLISTED'
  end as gate_id
from exec_grants e
left join allowlist_public ap
  on ap.schema_name = e.schema_name and ap.function_name = e.function_name
left join allowlist_anon aa
  on aa.schema_name = e.schema_name and aa.function_name = e.function_name
where (e.grantee = 'PUBLIC' and ap.function_name is null)
   or (e.grantee = 'anon' and aa.function_name is null)
order by e.schema_name, e.function_name, e.identity_args, gate_id;
