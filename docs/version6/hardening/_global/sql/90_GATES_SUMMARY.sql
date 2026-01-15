-- 90_GATES_SUMMARY.sql
-- Aggregated PASS/FAIL summary for global gates.
with
-- v0 scope: app-owned schema(s) only
in_scope_schemas as (
  select 'public'::text as schema_name
),
allowlist_public as (
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
-- Gate G1: schema CREATE granted to PUBLIC/anon/authenticated
schema_create as (
  select count(*) as failure_count
  from (
    select
      ns.schema_name,
      tg.rolname as grantee,
      ax.privilege_type
    from (
      select n.oid as nsp_oid, n.nspname as schema_name, n.nspowner
      from pg_namespace n
      where n.nspname not like 'pg_%'
        and n.nspname <> 'information_schema'
    ) ns
    cross join lateral aclexplode(
      coalesce(
        (select n.nspacl from pg_namespace n where n.oid = ns.nsp_oid),
        acldefault('n', ns.nspowner)
      )
    ) ax
    join (
      select r.oid, r.rolname from pg_roles r where r.rolname in ('anon','authenticated')
      union all select 0::oid as oid, 'PUBLIC'::text as rolname
    ) tg on tg.oid = ax.grantee
    where ax.privilege_type = 'CREATE'
  ) s
),
-- Gate G2: PUBLIC/anon DML on app tables
public_anon_dml as (
  select count(*) as failure_count
  from information_schema.table_privileges tp
  join in_scope_schemas s on s.schema_name = tp.table_schema
  where tp.grantee in ('PUBLIC','anon')
    and tp.privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
),
-- Gate G3/G4: PUBLIC/anon EXECUTE not allowlisted
public_anon_execute as (
  select count(*) as failure_count
  from (
    select distinct
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_args,
      tg.rolname as grantee
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join in_scope_schemas s on s.schema_name = n.nspname
    cross join lateral aclexplode(
      coalesce(p.proacl, acldefault('f', p.proowner))
    ) ax
    join (
      select r.oid, r.rolname from pg_roles r where r.rolname = 'anon'
      union all select 0::oid as oid, 'PUBLIC'::text as rolname
    ) tg on tg.oid = ax.grantee
    where p.prokind in ('f','p')
      and ax.privilege_type = 'EXECUTE'
  ) e
  left join allowlist_public ap
    on ap.schema_name = e.schema_name and ap.function_name = e.function_name
  left join allowlist_anon aa
    on aa.schema_name = e.schema_name and aa.function_name = e.function_name
  where (e.grantee = 'PUBLIC' and ap.function_name is null)
     or (e.grantee = 'anon' and aa.function_name is null)
),
-- Gate G5: public views without security_invoker and granted to anon/auth
view_insecure_granted as (
  select count(*) as failure_count
  from (
    select
      v.view_name,
      (coalesce(v.reloptions,'{}'::text[]) @> array['security_invoker=true'])
        or (coalesce(v.reloptions,'{}'::text[]) @> array['security_invoker=on']) as security_invoker
    from (
      select n.nspname as schema_name, c.relname as view_name, c.reloptions
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('v','m')
    ) v
  ) v
  join information_schema.table_privileges tp
    on tp.table_schema = 'public' and tp.table_name = v.view_name
  where v.security_invoker = false
    and tp.grantee in ('PUBLIC','anon','authenticated')
),
-- Gate G6: RLS disabled but grants to anon/auth
rls_disabled_exposed as (
  select count(*) as failure_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join in_scope_schemas s on s.schema_name = n.nspname
  join information_schema.table_privileges tp
    on tp.table_schema = n.nspname and tp.table_name = c.relname
  where c.relkind in ('r','p')
    and c.relrowsecurity = false
    and tp.grantee in ('PUBLIC','anon','authenticated')
),
-- Gate G7: RLS enabled but no policies
rls_enabled_no_policies as (
  select count(*) as failure_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join in_scope_schemas s on s.schema_name = n.nspname
  left join (
    select schemaname, tablename, count(*) as policy_count
    from pg_policies
    group by schemaname, tablename
  ) p on p.schemaname = n.nspname and p.tablename = c.relname
  where c.relkind in ('r','p')
    and c.relrowsecurity = true
    and coalesce(p.policy_count, 0) = 0
),
-- Gate G8: SECURITY DEFINER without pinned search_path
secdef_no_search_path as (
  select count(*) as failure_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join in_scope_schemas s on s.schema_name = n.nspname
  where p.prosecdef = true
    and not exists (
      select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'
    )
)
select 'G1' as gate_id, 'Schema CREATE grants restricted' as gate_name,
       case when schema_create.failure_count = 0 then 'PASS' else 'FAIL' end as status,
       schema_create.failure_count
from schema_create
union all
select 'G2', 'No PUBLIC/anon DML grants',
       case when public_anon_dml.failure_count = 0 then 'PASS' else 'FAIL' end,
       public_anon_dml.failure_count
from public_anon_dml
union all
select 'G3', 'No PUBLIC/anon EXECUTE on RPCs',
       case when public_anon_execute.failure_count = 0 then 'PASS' else 'FAIL' end,
       public_anon_execute.failure_count
from public_anon_execute
union all
select 'G5', 'Public views are security_invoker or not granted',
       case when view_insecure_granted.failure_count = 0 then 'PASS' else 'FAIL' end,
       view_insecure_granted.failure_count
from view_insecure_granted
union all
select 'G6', 'RLS enabled on exposed tables',
       case when rls_disabled_exposed.failure_count = 0 then 'PASS' else 'FAIL' end,
       rls_disabled_exposed.failure_count
from rls_disabled_exposed
union all
select 'G7', 'RLS tables have policies',
       case when rls_enabled_no_policies.failure_count = 0 then 'PASS' else 'FAIL' end,
       rls_enabled_no_policies.failure_count
from rls_enabled_no_policies
union all
select 'G8', 'SECURITY DEFINER has pinned search_path',
       case when secdef_no_search_path.failure_count = 0 then 'PASS' else 'FAIL' end,
       secdef_no_search_path.failure_count
from secdef_no_search_path
order by gate_id;
