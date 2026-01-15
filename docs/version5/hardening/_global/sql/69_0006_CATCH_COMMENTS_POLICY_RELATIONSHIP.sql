-- 69_0006_CATCH_COMMENTS_POLICY_RELATIONSHIP.sql
-- Compare permissive SELECT policies on public.catch_comments for redundancy/overlap.
-- Output: summary rows, heuristic subset checks, and diff hints (single result set).
with policies as (
  select
    p.policyname,
    p.roles,
    p.permissive,
    regexp_replace(
      lower(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')),
      E'\\s+',
      ' ',
      'g'
    ) as policy_text
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'catch_comments'
    and p.cmd = 'SELECT'
    and p.policyname in (
      'catch_comments_public_read',
      'catch_comments_select_viewable'
    )
),
base_texts as (
  select
    coalesce((select policy_text from policies where policyname = 'catch_comments_public_read'), '') as public_read_text,
    coalesce((select policy_text from policies where policyname = 'catch_comments_select_viewable'), '') as viewable_text,
    not exists (
      select 1 from policies where policyname = 'catch_comments_public_read'
    ) as public_read_missing,
    not exists (
      select 1 from policies where policyname = 'catch_comments_select_viewable'
    ) as viewable_missing
),
tokens as (
  select * from (values
    ('deleted_filter', E'deleted_at[[:space:]]+is[[:space:]]+null'),
    ('visibility_public', E'visibility[[:space:]]*=[[:space:]]*''public'''),
    ('visibility_followers', E'visibility[[:space:]]*=[[:space:]]*''followers'''),
    ('profile_follows', E'profile_follows'),
    ('profiles_private', E'is_private'),
    ('is_following', E'is_following'),
    ('blocked_check', E'is_blocked_either_way'),
    ('admin_check', E'is_admin')
  ) as t(token_name, token_regex)
),
token_hits as (
  select
    t.token_name,
    (bt.public_read_text ~* t.token_regex) as public_read_has,
    (bt.viewable_text ~* t.token_regex) as viewable_has
  from tokens t
  cross join base_texts bt
),
heuristics as (
  select
    not exists (
      select 1
      from token_hits th
      where th.viewable_has and not th.public_read_has
    ) as public_read_is_subset_of_viewable_guess,
    not exists (
      select 1
      from token_hits th
      where th.public_read_has and not th.viewable_has
    ) as viewable_is_subset_of_public_read_guess
),
combined as (
  select
    'summary' as record_type,
    p.policyname,
    p.roles,
    p.permissive,
    p.policy_text,
    null::boolean as public_read_is_subset_of_viewable_guess,
    null::boolean as viewable_is_subset_of_public_read_guess,
    null::text as token_name,
    null::boolean as public_read_has,
    null::boolean as viewable_has
  from policies p

  union all

  select
    'missing_policy' as record_type,
    null::text as policyname,
    null::name[] as roles,
    null::text as permissive,
    null::text as policy_text,
    null::boolean as public_read_is_subset_of_viewable_guess,
    null::boolean as viewable_is_subset_of_public_read_guess,
    'catch_comments_public_read' as token_name,
    null::boolean as public_read_has,
    null::boolean as viewable_has
  from base_texts bt
  where bt.public_read_missing

  union all

  select
    'missing_policy' as record_type,
    null::text as policyname,
    null::name[] as roles,
    null::text as permissive,
    null::text as policy_text,
    null::boolean as public_read_is_subset_of_viewable_guess,
    null::boolean as viewable_is_subset_of_public_read_guess,
    'catch_comments_select_viewable' as token_name,
    null::boolean as public_read_has,
    null::boolean as viewable_has
  from base_texts bt
  where bt.viewable_missing

  union all

  select
    'heuristics' as record_type,
    null::text as policyname,
    null::name[] as roles,
    null::text as permissive,
    null::text as policy_text,
    h.public_read_is_subset_of_viewable_guess,
    h.viewable_is_subset_of_public_read_guess,
    null::text as token_name,
    null::boolean as public_read_has,
    null::boolean as viewable_has
  from heuristics h

  union all

  select
    'diff_hint' as record_type,
    null::text as policyname,
    null::name[] as roles,
    null::text as permissive,
    null::text as policy_text,
    null::boolean as public_read_is_subset_of_viewable_guess,
    null::boolean as viewable_is_subset_of_public_read_guess,
    th.token_name,
    th.public_read_has,
    th.viewable_has
  from token_hits th
  where th.public_read_has is distinct from th.viewable_has
)
select *
from combined
order by
  case record_type
    when 'summary' then 0
    when 'missing_policy' then 1
    when 'heuristics' then 2
    else 3
  end,
  policyname nulls last,
  token_name nulls last;
