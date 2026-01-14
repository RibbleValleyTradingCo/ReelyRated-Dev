# Followups

- [x] Verify non-admins cannot call `admin_list_moderation_log` even though EXECUTE is granted to `authenticated`.
  - Evidence: AA-RPC-NONADMIN-DENY-HAR / AA-RPC-NONADMIN-DENY-SHOT (UI/console) + AA-SQL-RPC-NONADMIN-DENY (SQL)
  - Observed error: `P0001: Admin privileges required` (RAISE at function line 12).
- [ ] Confirm Realtime `postgres_changes` on `moderation_log` respects admin-only access (RLS/replication settings) for non-admin clients.
  - Current probe: `public.moderation_log` is NOT in the `supabase_realtime` publication (pg_publication_tables returned 0 rows), so Postgres Changes will not stream this table yet.
  - Current RLS posture: policy `moderation_log_admin_read` exists (SELECT) with qual `is_admin(uid())` (admin-only read gate).
  - Decision later: if we intentionally want realtime for audit-log, add the table to `supabase_realtime` via migration; otherwise treat realtime as N/A for this surface.
- [ ] Validate that `catch_comments` lookup for comment targets works for deleted comments; document whether admin can still navigate to deleted comments or receives a generic error.
- [ ] Review server-side exposure of `moderation_log.metadata` (client redaction is UI-only); confirm no sensitive data is returned by the RPC.
- [ ] Confirm whether `p_user_id` filtering should be exposed in UI (currently always null) and document intended scope.
- [ ] Check performance bounds for export (paging loop) and whether a server-side limit is required for large logs.
