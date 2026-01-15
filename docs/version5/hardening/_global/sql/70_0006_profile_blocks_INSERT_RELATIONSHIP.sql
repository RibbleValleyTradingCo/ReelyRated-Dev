-- 70_0006_profile_blocks_INSERT_RELATIONSHIP.sql
-- Compare PERMISSIVE INSERT policies on public.profile_blocks for redundancy/overlap.
-- Output: policy rows, role-split analysis, and token diff hints (single result set).
with policies as (
  select
    p.policyname,
    p.roles,
    p.permissive,
    p.qual,
    p.with_check,
    regexp_replace(
      lower(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')),
      E'\\s+',
      ' ',
      'g'
    ) as policy_text
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'profile_blocks'
    and p.cmd = 'INSERT'
),
roles_flat as (
  select
    policyname,
    unnest(coalesce(roles, array['PUBLIC'::name])) as role_name
  from policies
  where permissive = 'PERMISSIVE'
),
per_role as (
  select
    role_name,
    count(*) as permissive_policy_count
  from roles_flat
  group by role_name
),
analysis as (
  select
    exists (select 1 from per_role where permissive_policy_count >= 2) as multiple_permissive_same_role,
    (select count(*) from per_role) > 1
      and not exists (select 1 from per_role where permissive_policy_count >= 2) as clean_role_split_guess
),
tokens as (
  select * from (values
    ('admin_check', 'is_admin'),
    ('blocker_id', 'blocker_id'),
    ('blocked_id', 'blocked_id'),
    ('uid_call', E'uid[[:space:]]*\\(')
  ) as t(token_name, token_regex)
),
token_hits as (
  select
    t.token_name,
    p.policyname,
    (p.policy_text ~* t.token_regex) as policy_has
  from tokens t
  cross join policies p
),
token_diff as (
  select
    token_name,
    bool_and(policy_has) as all_have,
    bool_or(policy_has) as any_have
  from token_hits
  group by token_name
),
combined as (
  select
    'analysis' as record_type,
    'INSERT'::text as cmd,
    null::text as policyname,
    null::name[] as roles,
    null::text as permissive,
    null::text as qual,
    null::text as with_check,
    null::text as policy_text,
    null::name as role_name,
    null::int as permissive_policy_count,
    a.multiple_permissive_same_role,
    a.clean_role_split_guess,
    null::text as token_name,
    null::boolean as policy_has
  from analysis a

  union all

  select
    'by_role' as record_type,
    'INSERT'::text as cmd,
    null::text as policyname,
    null::name[] as roles,
    null::text as permissive,
    null::text as qual,
    null::text as with_check,
    null::text as policy_text,
    pr.role_name,
    pr.permissive_policy_count,
    null::boolean as multiple_permissive_same_role,
    null::boolean as clean_role_split_guess,
    null::text as token_name,
    null::boolean as policy_has
  from per_role pr

  union all

  select
    'policy' as record_type,
    'INSERT'::text as cmd,
    p.policyname,
    p.roles,
    p.permissive,
    p.qual,
    p.with_check,
    p.policy_text,
    null::name as role_name,
    null::int as permissive_policy_count,
    null::boolean as multiple_permissive_same_role,
    null::boolean as clean_role_split_guess,
    null::text as token_name,
    null::boolean as policy_has
  from policies p

  union all

  select
    'diff_hint' as record_type,
    'INSERT'::text as cmd,
    null::text as policyname,
    null::name[] as roles,
    null::text as permissive,
    null::text as qual,
    null::text as with_check,
    null::text as policy_text,
    null::name as role_name,
    null::int as permissive_policy_count,
    null::boolean as multiple_permissive_same_role,
    null::boolean as clean_role_split_guess,
    td.token_name,
    null::boolean as policy_has
  from token_diff td
  where td.any_have and not td.all_have

  union all

  select
    'token' as record_type,
    'INSERT'::text as cmd,
    th.policyname,
    null::name[] as roles,
    null::text as permissive,
    null::text as qual,
    null::text as with_check,
    null::text as policy_text,
    null::name as role_name,
    null::int as permissive_policy_count,
    null::boolean as multiple_permissive_same_role,
    null::boolean as clean_role_split_guess,
    th.token_name,
    th.policy_has
  from token_hits th
)
select *
from combined
order by
  case record_type
    when 'analysis' then 0
    when 'by_role' then 1
    when 'policy' then 2
    when 'diff_hint' then 3
    else 4
  end,
  policyname nulls last,
  role_name nulls last,
  token_name nulls last;
