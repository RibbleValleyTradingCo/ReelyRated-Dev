-- Global SQL verification — HARDENING SYSTEM POSTURE
-- Each block emits JSON and is labeled with an evidence filename.

-- OUTPUT: docs/version5/hardening/_global/evidence/sql/_global_sql_default-acl-deep-dive_2026-01-07.json
select jsonb_pretty(jsonb_agg(to_jsonb(t))) as default_acl_deep_dive
from (
  select
    defaclrole::regrole::text as defacl_role,
    n.nspname as schema,
    case d.defaclobjtype
      when 'r' then 'table'
      when 'S' then 'sequence'
      when 'f' then 'function'
      else d.defaclobjtype::text
    end as object_type,
    d.defaclacl
  from pg_default_acl d
  join pg_namespace n on n.oid = d.defaclnamespace
  order by defaclrole::regrole::text, n.nspname, d.defaclobjtype
) t;

-- OUTPUT: docs/version5/hardening/_global/evidence/sql/_global_sql_publication-coverage_2026-01-07.json
select jsonb_pretty(jsonb_agg(to_jsonb(t))) as publication_coverage
from (
  select
    p.pubname as publication,
    n.nspname as table_schema,
    c.relname as table_name
  from pg_publication p
  left join pg_publication_rel pr on pr.prpubid = p.oid
  left join pg_class c on c.oid = pr.prrelid
  left join pg_namespace n on n.oid = c.relnamespace
  order by p.pubname, n.nspname, c.relname
) t;

-- OUTPUT: docs/version5/hardening/_global/evidence/sql/_global_sql_rls-coverage_2026-01-07.json
select jsonb_pretty(jsonb_agg(to_jsonb(t))) as rls_coverage
from (
  select
    n.nspname as table_schema,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced,
    exists (
      select 1
      from information_schema.role_table_grants g
      where g.table_schema = n.nspname
        and g.table_name = c.relname
        and g.grantee in ('anon', 'authenticated')
    ) as client_reachable_candidate
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
  order by n.nspname, c.relname
) t;

-- OUTPUT: docs/version5/hardening/_global/evidence/sql/_global_sql_table-grants_2026-01-07.json
select jsonb_pretty(jsonb_agg(to_jsonb(t))) as table_grants
from (
  select
    n.nspname as table_schema,
    c.relname as table_name,
    ax.grantor::regrole::text as grantor,
    ax.grantee::regrole::text as grantee,
    ax.privilege_type
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) ax on true
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and ax.grantee::regrole::text in ('anon', 'authenticated', 'service_role')
  order by n.nspname, c.relname, grantee, privilege_type
) t;

-- OUTPUT: docs/version5/hardening/_global/evidence/sql/_global_sql_function-exec-grants_2026-01-07.json
select jsonb_pretty(jsonb_agg(to_jsonb(t))) as function_exec_grants
from (
  select
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.prosecdef as security_definer,
    p.proacl,
    p.proconfig,
    case
      when p.proacl is null then true
      when array_to_string(p.proacl, ',') like '%=X%' then true
      when array_to_string(p.proacl, ',') like '%anon=X%' then true
      when array_to_string(p.proacl, ',') like '%authenticated=X%' then true
      else false
    end as has_public_execute,
    case
      when p.proacl is null then true
      when array_to_string(p.proacl, ',') like '%authenticated=X%' then true
      else false
    end as has_authenticated_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
  order by p.proname, identity_args
) t;

-- OUTPUT: docs/version5/hardening/_global/evidence/sql/_global_sql_public-exec-on-admin-owner-rpcs_2026-01-07.json
select jsonb_pretty(jsonb_agg(to_jsonb(t))) as public_exec_on_admin_owner_rpcs
from (
  select
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.prosecdef as security_definer,
    p.proacl,
    p.proconfig,
    case
      when p.proacl is null then true
      when array_to_string(p.proacl, ',') like '%=X%' then true
      when array_to_string(p.proacl, ',') like '%anon=X%' then true
      when array_to_string(p.proacl, ',') like '%authenticated=X%' then true
      else false
    end as has_public_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (p.proname like 'admin\_%' or p.proname like 'owner\_%')
    and (
      p.proacl is null
      or array_to_string(p.proacl, ',') like '%=X%'
      or array_to_string(p.proacl, ',') like '%anon=X%'
      or array_to_string(p.proacl, ',') like '%authenticated=X%'
    )
  order by p.proname, identity_args
) t;

-- OUTPUT: docs/version5/hardening/_global/evidence/sql/_global_sql_security-definer-hazards_2026-01-07.json
select jsonb_pretty(jsonb_agg(to_jsonb(t))) as security_definer_hazards
from (
  select
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.prosecdef as security_definer,
    p.proacl,
    p.proconfig,
    case
      when p.proacl is null then true
      when array_to_string(p.proacl, ',') like '%=X%' then true
      when array_to_string(p.proacl, ',') like '%anon=X%' then true
      when array_to_string(p.proacl, ',') like '%authenticated=X%' then true
      else false
    end as has_public_execute,
    case
      when coalesce(array_to_string(p.proconfig, ','), '') like '%search_path=%' then false
      else true
    end as missing_pinned_search_path
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef = true
    and (
      coalesce(array_to_string(p.proconfig, ','), '') not like '%search_path=%'
      or p.proacl is null
      or array_to_string(p.proacl, ',') like '%=X%'
      or array_to_string(p.proacl, ',') like '%anon=X%'
      or array_to_string(p.proacl, ',') like '%authenticated=X%'
    )
  order by p.proname, identity_args
) t;

-- OUTPUT: docs/version5/hardening/_global/evidence/sql/_global_sql_pg-stat-statements_2026-01-07.json
select
  case
    when to_regclass('public.pg_stat_statements') is null then
      jsonb_pretty(
        jsonb_build_array(
          jsonb_build_object(
            'error', 'pg_stat_statements not available',
            'note', 'pg_stat_statements not enabled/accessible'
          )
        )
      )
    else
      jsonb_pretty(
        (
          select jsonb_agg(to_jsonb(t))
          from (
            select
              left(query, 500) as query,
              calls,
              total_time,
              mean_time,
              rows
            from pg_stat_statements
            order by calls desc
            limit 20
          ) t
        )
      )
  end as pg_stat_statements_snapshot;
