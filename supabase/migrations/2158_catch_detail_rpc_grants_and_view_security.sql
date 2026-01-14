-- 2158_catch_detail_rpc_grants_and_view_security.sql
-- Purpose:
-- - Enforce /catch/:id persona contract at the DB boundary (anon read-only, no interactions).
-- - Remove PUBLIC/anon EXECUTE on interaction RPCs; keep authenticated allowed.
-- - Ensure catch-detail views run with invoker privileges (security_invoker=true).
--
-- Signatures confirmed from migrations:
-- - 2104_rate_catch_notifications.sql (rate_catch_with_rate_limit)
-- - 2105_react_catch_visibility_fix.sql (react_to_catch_with_rate_limit)
-- - 2113_harden_get_catch_rating_summary.sql (get_catch_rating_summary)
-- - 2117_harden_profile_follows_rls.sql (follow_profile_with_rate_limit)
-- - 2112_fix_rate_limit_helpers_single_logger.sql (create_comment_with_rate_limit)
-- - 2024_phase2_comments_threading_enhancements.sql (soft_delete_comment)
-- - 2044_allow_admin_report_notifications.sql (create_notification)

-- ------------------------------------------------------------
-- A) RPC EXECUTE grants (interaction RPCs: authenticated only)
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.react_to_catch_with_rate_limit(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.react_to_catch_with_rate_limit(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.react_to_catch_with_rate_limit(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.follow_profile_with_rate_limit(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.follow_profile_with_rate_limit(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.follow_profile_with_rate_limit(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rate_catch_with_rate_limit(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rate_catch_with_rate_limit(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.rate_catch_with_rate_limit(uuid, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_comment_with_rate_limit(uuid, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_comment_with_rate_limit(uuid, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_comment_with_rate_limit(uuid, text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.soft_delete_comment(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.soft_delete_comment(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_comment(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_notification(
  uuid,
  text,
  public.notification_type,
  uuid,
  uuid,
  uuid,
  jsonb
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_notification(
  uuid,
  text,
  public.notification_type,
  uuid,
  uuid,
  uuid,
  jsonb
) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_notification(
  uuid,
  text,
  public.notification_type,
  uuid,
  uuid,
  uuid,
  jsonb
) TO authenticated;

-- ------------------------------------------------------------
-- B) Ratings summary (anon allowed; no PUBLIC EXECUTE)
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO authenticated;

-- ------------------------------------------------------------
-- PG15+ guard for security_invoker view option
-- ------------------------------------------------------------
DO $$
BEGIN
  IF current_setting('server_version_num')::int < 150000 THEN
    RAISE EXCEPTION 'security_invoker view option requires PostgreSQL 15+. Current: %', current_setting('server_version');
  END IF;
END $$;

-- ------------------------------------------------------------
-- C) View security posture (invoker, not definer)
-- ------------------------------------------------------------
ALTER VIEW public.catch_comments_with_admin SET (security_invoker = true);
ALTER VIEW public.catch_mention_candidates SET (security_invoker = true);

-- ------------------------------------------------------------
-- D) View grants (authenticated only; no PUBLIC)
-- ------------------------------------------------------------
REVOKE ALL ON public.catch_comments_with_admin FROM PUBLIC;
REVOKE ALL ON public.catch_comments_with_admin FROM anon;
GRANT SELECT ON public.catch_comments_with_admin TO authenticated;

REVOKE ALL ON public.catch_mention_candidates FROM PUBLIC;
REVOKE ALL ON public.catch_mention_candidates FROM anon;
GRANT SELECT ON public.catch_mention_candidates TO authenticated;

-- ------------------------------------------------------------
-- Verification / Evidence (do not execute in migration)
-- Save outputs under: docs/version5/hardening/surfaces/catch-detail/evidence/sql/
-- ------------------------------------------------------------
-- select routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema='public'
--   and routine_name in (
--     'get_catch_rating_summary',
--     'react_to_catch_with_rate_limit',
--     'follow_profile_with_rate_limit',
--     'rate_catch_with_rate_limit',
--     'create_comment_with_rate_limit',
--     'soft_delete_comment',
--     'create_notification'
--   )
-- order by routine_name, grantee;
--
-- select c.relname, c.reloptions,
--        (coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true']) as security_invoker
-- from pg_class c
-- join pg_namespace n on n.oid=c.relnamespace
-- where n.nspname='public' and c.relname in ('catch_comments_with_admin','catch_mention_candidates');
