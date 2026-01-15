-- 00_CONTEXT.sql
-- Deterministic, single-row context snapshot.
select
  (now() at time zone 'utc') as run_at_utc,
  current_user,
  session_user,
  current_setting('server_version') as server_version,
  current_setting('server_version_num') as server_version_num,
  current_setting('search_path') as search_path,
  current_setting('role', true) as role_setting,
  current_setting('request.jwt.claim.role', true) as jwt_role,
  current_setting('request.jwt.claim.sub', true) as jwt_sub;
