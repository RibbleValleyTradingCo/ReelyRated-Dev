-- 2177_drop_catch_comments_select_viewable.sql
-- Purpose: remove permissive SELECT bypass on catch_comments (missing block/private gates).

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  pol record;
BEGIN
  select p.schemaname, p.tablename, p.policyname, p.cmd, p.permissive
  into pol
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'catch_comments'
    and p.policyname = 'catch_comments_select_viewable'
    and p.cmd = 'SELECT'
  limit 1;

  if not found then
    raise notice 'Policy %.% not found; skipping', 'public.catch_comments', 'catch_comments_select_viewable';
    return;
  end if;

  if pol.permissive <> 'PERMISSIVE' then
    raise exception 'Policy %.% expected PERMISSIVE but found %', pol.tablename, pol.policyname, pol.permissive;
  end if;

  execute format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
END;
$$;

COMMIT;
