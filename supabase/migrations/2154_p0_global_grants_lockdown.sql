-- P0 global grants lockdown (remove danger privs; lock internal tables from anon)
-- Scope: public schema only.

-- P0-A: remove dangerous table privileges from client roles (PUBLIC/anon/authenticated).
REVOKE TRIGGER, TRUNCATE, REFERENCES, MAINTAIN
  ON ALL TABLES IN SCHEMA public
  FROM PUBLIC, anon, authenticated;

-- P0-B: lock clearly internal tables from PUBLIC/anon; keep minimal SELECT for authenticated where needed.
REVOKE ALL PRIVILEGES ON TABLE public.admin_users FROM PUBLIC, anon;
REVOKE ALL PRIVILEGES ON TABLE public.moderation_log FROM PUBLIC, anon;
REVOKE ALL PRIVILEGES ON TABLE public.user_warnings FROM PUBLIC, anon;
REVOKE ALL PRIVILEGES ON TABLE public.rate_limits FROM PUBLIC, anon;

REVOKE ALL PRIVILEGES ON TABLE public.admin_users FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.moderation_log FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_warnings FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.rate_limits FROM authenticated;

GRANT SELECT ON TABLE public.admin_users TO authenticated;
GRANT SELECT ON TABLE public.moderation_log TO authenticated;
GRANT SELECT ON TABLE public.user_warnings TO authenticated;
-- Intentionally no grants for public.rate_limits (client should use rate-limit RPCs only).

-- P0-C: remove UPDATE on sequences for PUBLIC/anon/authenticated (public schema only).
REVOKE UPDATE ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Rollback guidance (manual, requires pre-migration snapshot):
-- 1) Re-run GRANTS-SUMMARY-LIVE.sql and GRANTS-REDFLAGS-LIVE.sql before applying this migration.
-- 2) Use the snapshot to re-GRANT any privileges removed above.
--    Example (if previously granted):
--    GRANT TRIGGER, TRUNCATE, REFERENCES, MAINTAIN ON ALL TABLES IN SCHEMA public TO PUBLIC, anon, authenticated;
--    GRANT UPDATE ON ALL SEQUENCES IN SCHEMA public TO PUBLIC, anon, authenticated;
--    GRANT <prev_table_privs> ON TABLE public.admin_users TO PUBLIC/anon/authenticated;
--    GRANT <prev_table_privs> ON TABLE public.moderation_log TO PUBLIC/anon/authenticated;
--    GRANT <prev_table_privs> ON TABLE public.user_warnings TO PUBLIC/anon/authenticated;
--    GRANT <prev_table_privs> ON TABLE public.rate_limits TO PUBLIC/anon/authenticated;
