# Followups

## Captured observations (so far)

- **Non-admin RPC denial confirmed (at least for `admin_list_moderation_log`):** calling the RPC as a non-admin returns `ERROR: P0001: Admin privileges required` (RAISE in the function body). Capture this error shape in HAR/screenshot during the sweep.
- **RLS policy confirmed on `public.moderation_log`:** policy `moderation_log_admin_read` exists with `cmd=SELECT` and `qual=is_admin(uid())` (roles `{public}`). This supports server-side enforcement for direct selects.

- [ ] **Non-admin RPC denial (all three RPCs):** Verify non-admin personas cannot call `admin_list_moderation_log`, `admin_warn_user`, or `admin_clear_moderation_status` even if `EXECUTE` is granted to `authenticated`. Capture the exact error shape/message and confirm it is consistent (anti-enumeration) for:

  - a valid `p_user_id` / `:userId`
  - an invalid/non-existent `p_user_id` / `:userId`
  - confirm UI error handling does not leak whether `:userId` exists (same toast/redirect + same RPC error surface)

- [ ] **EXECUTE grants (belt + braces):** Confirm these RPCs do **not** have `EXECUTE` granted to `PUBLIC` (default/global privilege). If any `PUBLIC` execute exists, plan to revoke it and explicitly grant only intended roles.

- [ ] **SECURITY DEFINER hardening (search_path + qualification):** Confirm each SECURITY DEFINER RPC pins `search_path` defensively and that all object references in the body are schema-qualified.

  - Run Supabase Database Advisor checks for mutable `search_path` on functions and remediate any findings.

  - Preferred: `SET search_path = ''` + fully-qualified references (`public.*`).
  - If not empty: ensure no user-writable schemas are present and force `pg_temp` to be searched last.

- [ ] **Profiles data scope:** Confirm selected profile columns are minimal and safe for this surface (`username`, `warn_count`, `moderation_status`, `suspension_until`, `avatar_path`, `avatar_url`). Also confirm `profiles_select_all` does not unintentionally expose sensitive fields to non-admin roles on other surfaces. This surface should only expose the minimum fields required to moderate a user; anything else should remain admin-only and/or be delivered via an admin-safe RPC.

- [ ] **No self-elevation:** Confirm `admin_users` cannot be written by client roles (no insert/update path that lets a non-admin become admin).

- [ ] **RPC payload scope:** Confirm returned payloads do not expose sensitive data beyond admin needs (e.g., moderation_log metadata contents, warning details, profile fields).

- [ ] **Server-side bounds:** Confirm `admin_list_moderation_log` enforces sane limits (`p_limit` clamped/max, `p_offset` validated) and there are no unbounded list endpoints.

- [ ] **Audit trail + notifications:** Verify admin action RPCs create expected `moderation_log` rows and notifications for warn/suspend/ban/clear, and that RLS prevents non-admins from reading these artifacts.

## Quick SQL probes

- Function security + `search_path`:

  ```sql
  select
    n.nspname as schema,
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.proconfig as function_config
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('admin_list_moderation_log','admin_warn_user','admin_clear_moderation_status')
  order by p.proname;
  ```

- EXECUTE grants (ensure no `PUBLIC` execute):

  ```sql
  select
    routine_schema,
    routine_name,
    grantee,
    privilege_type
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name in ('admin_list_moderation_log','admin_warn_user','admin_clear_moderation_status')
  order by routine_name, grantee;
  ```

- Table write-surface check (spot obvious self-elevation risk):
  ```sql
  select
    grantee,
    table_name,
    privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'admin_users'
  order by grantee, privilege_type;
  ```

Note: SECURITY DEFINER functions + a mutable/unsafe `search_path` can allow unexpected object resolution. Treat this as a mandatory review item for every admin RPC. Also remember that Postgres views run with the view owner’s privileges by default; if we introduce any new views for admin surfaces, prefer SECURITY INVOKER views (or enforce RLS-safe patterns) to avoid bypass surprises.
