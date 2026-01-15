-- 2175_public_rls_uid_initplan.sql
-- Purpose: clear lint 0003_auth_rls_initplan by wrapping auth.uid() as (select auth.uid()) in public RLS policies.
-- Non-goals: no grants; no RLS toggles; no policy command/role changes.

BEGIN;

-- Preflight: ensure auth.uid() exists.
DO $$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL THEN
    RAISE EXCEPTION 'auth.uid() missing';
  END IF;
END;
$$;

DO $$
DECLARE
  r record;
  new_qual text;
  new_with_check text;
  stmt text;
  changed boolean;
BEGIN
  FOR r IN
    SELECT p.schemaname, p.tablename, p.policyname, p.qual, p.with_check
    FROM pg_policies p
    JOIN (VALUES
      ('public','admin_users','admin_users_self_select'),
      ('public','catch_comments','catch_comments_admin_read_all'),
      ('public','catch_comments','catch_comments_admin_update'),
      ('public','catch_comments','catch_comments_insert_viewable'),
      ('public','catch_comments','catch_comments_public_read'),
      ('public','catch_comments','catch_comments_select_viewable'),
      ('public','catch_comments','catch_comments_update_owner'),
      ('public','catch_reactions','catch_reactions_owner_all'),
      ('public','catch_reactions','catch_reactions_select_viewable'),
      ('public','catch_reactions','catch_reactions_write_visible_unblocked_ins'),
      ('public','catch_reactions','catch_reactions_write_visible_unblocked_upd'),
      ('public','catches','catches_admin_read_all'),
      ('public','catches','catches_owner_all'),
      ('public','catches','catches_owner_mutate'),
      ('public','catches','catches_owner_update_delete'),
      ('public','catches','catches_public_read'),
      ('public','moderation_log','moderation_log_admin_read'),
      ('public','notifications','notifications_admin_read'),
      ('public','notifications','notifications_recipient_only'),
      ('public','profile_blocks','profile_blocks_delete_admin_all'),
      ('public','profile_blocks','profile_blocks_delete_self'),
      ('public','profile_blocks','profile_blocks_insert_admin_all'),
      ('public','profile_blocks','profile_blocks_insert_self'),
      ('public','profile_blocks','profile_blocks_select_admin_all'),
      ('public','profile_blocks','profile_blocks_select_self_or_blocked'),
      ('public','profile_follows','profile_follows_admin_select_all'),
      ('public','profile_follows','profile_follows_insert_not_blocked'),
      ('public','profile_follows','profile_follows_owner_all'),
      ('public','profile_follows','profile_follows_select_related'),
      ('public','profiles','profiles_update_self'),
      ('public','rate_limits','rate_limits_admin_select'),
      ('public','rate_limits','rate_limits_self_insert'),
      ('public','ratings','ratings_owner_mutate'),
      ('public','ratings','ratings_read_visible_catches'),
      ('public','ratings','ratings_write_visible_unblocked_ins'),
      ('public','ratings','ratings_write_visible_unblocked_upd'),
      ('public','reports','reports_admin_all'),
      ('public','reports','reports_owner_all'),
      ('public','sessions','sessions_modify_own'),
      ('public','sessions','sessions_select_own'),
      ('public','user_warnings','user_warnings_admin_read'),
      ('public','venue_owners','venue_owners_admin_all'),
      ('public','venue_owners','venue_owners_self_select'),
      ('public','venue_ratings','Admins can select all venue ratings'),
      ('public','venue_ratings','Allow users to delete own venue ratings'),
      ('public','venue_ratings','Allow users to insert own venue ratings'),
      ('public','venue_ratings','Allow users to select own venue ratings'),
      ('public','venue_ratings','Allow users to update own venue ratings'),
      ('public','venues','venues_insert_admin_only'),
      ('public','venues','venues_select_admin_all'),
      ('public','venues','venues_select_owner'),
      ('public','venues','venues_update_admin_all'),
      ('public','venues','venues_update_owner')
    ) AS t(schema_name, tablename, policyname)
      ON t.schema_name = p.schemaname
     AND t.tablename = p.tablename
     AND t.policyname = p.policyname
    WHERE p.schemaname = 'public'
    ORDER BY p.tablename, p.policyname
  LOOP
    IF r.qual IS NULL THEN
      new_qual := NULL;
    ELSIF r.qual ~* '\\(\\s*select\\s+auth\\s*\\.\\s*uid\\s*\\(\\s*\\)\\s*\\)' THEN
      new_qual := r.qual;
    ELSE
      new_qual := regexp_replace(
        r.qual,
        'auth\\s*\\.\\s*uid\\s*\\(\\s*\\)',
        '(select auth.uid())',
        'gi'
      );
    END IF;

    IF r.with_check IS NULL THEN
      new_with_check := NULL;
    ELSIF r.with_check ~* '\\(\\s*select\\s+auth\\s*\\.\\s*uid\\s*\\(\\s*\\)\\s*\\)' THEN
      new_with_check := r.with_check;
    ELSE
      new_with_check := regexp_replace(
        r.with_check,
        'auth\\s*\\.\\s*uid\\s*\\(\\s*\\)',
        '(select auth.uid())',
        'gi'
      );
    END IF;

    changed := (new_qual IS DISTINCT FROM r.qual)
      OR (new_with_check IS DISTINCT FROM r.with_check);

    IF NOT changed THEN
      CONTINUE;
    END IF;

    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);

    IF new_qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF new_with_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_with_check);
    END IF;

    EXECUTE stmt;
  END LOOP;
END;
$$;

-- Post-check: list any remaining auth.uid() uses that are not initplan-safe.
-- select schemaname, tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%auth.uid()%'
--   and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) not like '%(select auth.uid())%'
-- order by tablename, policyname, cmd;

COMMIT;
