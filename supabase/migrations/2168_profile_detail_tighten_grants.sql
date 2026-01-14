-- 2168_profile_detail_tighten_grants.sql
-- Purpose: profile-detail surface hardening — reduce anon table privileges (no RLS/policy changes).
-- Non-goals: do not modify policies; do not add grants; do not touch other objects.

REVOKE INSERT, UPDATE, DELETE ON TABLE public.ratings FROM anon;
REVOKE SELECT ON TABLE public.notifications FROM anon;

-- Verification (run manually)
-- Verify anon no longer has DML on ratings:
-- select table_name, grantee, privilege_type
-- from information_schema.table_privileges
-- where table_schema='public'
--   and table_name='ratings'
--   and grantee='anon'
-- order by privilege_type;
--
-- Verify anon no longer has SELECT on notifications:
-- select table_name, grantee, privilege_type
-- from information_schema.table_privileges
-- where table_schema='public'
--   and table_name='notifications'
--   and grantee='anon'
-- order by privilege_type;
