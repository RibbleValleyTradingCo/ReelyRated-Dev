-- 2159_catch_detail_auth_only_ratings_rpc.sql
-- Purpose: Path A (/catch/:id is auth-only) => restrict ratings summary RPC to authenticated only.
-- Note: Interaction RPC grants were already tightened in 2158.
-- Contract note: Path A: anon redirected to /auth; ratings RPC no longer exposed to anon.

REVOKE EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_catch_rating_summary(uuid) TO authenticated;

-- Verification (do not execute in migration):
-- Save output under: docs/version5/hardening/surfaces/catch-detail/evidence/sql/
-- select routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name = 'get_catch_rating_summary'
--   and grantee in ('PUBLIC','anon','authenticated','postgres','service_role')
-- order by routine_name, grantee;
