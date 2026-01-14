# Followups

- [ ] Verify non-admins cannot call `admin_list_reports`, `admin_update_report_status`, `admin_delete_*`, `admin_restore_*`, or `admin_warn_user` even though EXECUTE is granted to `authenticated`.
- [ ] SECURITY DEFINER hygiene: verify each admin RPC pins `search_path` (e.g. `SET search_path TO ''`) and does not rely on unqualified objects (object-shadowing defense).
- [ ] Confirm Realtime `postgres_changes` on `public.reports` works (table in `supabase_realtime` publication) and respects admin-only access.

  Probe publication membership:

  ```sql
  select schemaname, tablename
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'reports';
  ```

- [ ] Admin gate dependency: confirm `anon`/`authenticated` have no INSERT/UPDATE/DELETE on `admin_users` and RLS/write policies cannot be abused to self-elevate.
- [ ] Validate `admin_list_reports` output fields (`details`, reporter/reported usernames) and confirm no sensitive data is exposed in the RPC payload.
- [ ] Confirm server-side bounds on `p_limit`/`p_offset`/date range for `admin_list_reports` to prevent large scans.
- [ ] Verify admin action RPCs (update status, delete/restore content, warn user) create expected `moderation_log` rows and notifications.
- [ ] Check whether moderation history (`moderation_log`) and warnings (`user_warnings`) should be paginated (current queries load full history).
- [ ] Document behavior when reported content is missing (targetMissing) and when comment navigation fallback fails.
