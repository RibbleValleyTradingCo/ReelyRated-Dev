# Surface: admin-reports

## Route patterns

- `/admin/reports`

## Router entry files

- `src/App.tsx`
- `src/pages/AdminReports.tsx`

## Personas

- Admin only.
- Anon → redirected to `/auth`.
- Authenticated non-admin personas → redirected to `/feed` with a toast:
  - Normal (oneill467348)
  - Owner (venue owner)
  - Private (authenticated, non-owner)
  - Blocked (authenticated; block relationship present)
- Admin persona can access and moderate reports.

## Deny UX

- Anon: `useAdminAuth` toasts "Authentication required" and navigates to `/auth`. `src/hooks/useAdminAuth.ts:24`.
- Auth non-admin: `useAdminAuth` toasts "Admin access required" and navigates to `/feed`. `src/hooks/useAdminAuth.ts:35`.
- While admin check runs, page shows a loading spinner; if not admin after check, component renders `null`. `src/pages/AdminReports.tsx:808`.
- Router-level: confirm `/admin/reports` is behind an authenticated route wrapper in `src/App.tsx` (defense-in-depth). Regardless, `useAdminAuth` is the primary admin gate.

## Entrypoints

### RPCs

All RPCs below are `SECURITY DEFINER` and must remain hardened with (a) an internal `admin_users` gate that raises `Admin privileges required` for non-admins, and (b) a pinned `search_path` (e.g. `SET search_path TO ''`) to prevent object-shadowing. Verify both in the sweep.

| RPC                        | File                             | DB posture                                                               | Notes                                                                                                                                                       |
| -------------------------- | -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| admin_list_reports         | `src/pages/AdminReports.tsx:193` | SECURITY DEFINER + internal admin check (GRANT EXECUTE to authenticated) | Filters: p_status/p_type/p_reported_user_id/p_from/p_to/p_sort_direction/p_limit/p_offset. `supabase/migrations/2072_admin_report_rpcs.sql:54`.             |
| admin_update_report_status | `src/pages/AdminReports.tsx:532` | SECURITY DEFINER + internal admin check                                  | Updates `reports` + inserts `moderation_log`. `supabase/migrations/2072_admin_report_rpcs.sql:139`.                                                         |
| admin_delete_catch         | `src/pages/AdminReports.tsx:610` | SECURITY DEFINER + internal admin check                                  | Soft-deletes `catches`, inserts `moderation_log`, creates notification. `supabase/migrations/1006_auth_and_rpc_helpers.sql:392`.                            |
| admin_delete_comment       | `src/pages/AdminReports.tsx:616` | SECURITY DEFINER + internal admin check                                  | Soft-deletes `catch_comments`, inserts `moderation_log`, creates notification. `supabase/migrations/1006_auth_and_rpc_helpers.sql:552`.                     |
| admin_restore_catch        | `src/pages/AdminReports.tsx:650` | SECURITY DEFINER + internal admin check                                  | Restores `catches`, inserts `moderation_log`, creates notification. `supabase/migrations/1006_auth_and_rpc_helpers.sql:472`.                                |
| admin_restore_comment      | `src/pages/AdminReports.tsx:660` | SECURITY DEFINER + internal admin check                                  | Restores `catch_comments`, inserts `moderation_log`, creates notification. `supabase/migrations/1006_auth_and_rpc_helpers.sql:632`.                         |
| admin_warn_user            | `src/pages/AdminReports.tsx:716` | SECURITY DEFINER + internal admin check                                  | Inserts `user_warnings`, updates `profiles`, inserts `moderation_log`, creates notification. `supabase/migrations/2048_moderation_notification_copy.sql:9`. |

### PostgREST

| Table          | Operations | File                             | DB posture                           | Notes                                                                                                 |
| -------------- | ---------- | -------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| admin_users    | select     | `src/lib/admin.ts:14`            | RLS: `admin_users_self_select`       | Admin gate via `isAdminUser`. `supabase/migrations/2016_phase1_admin_visibility.sql:20`.              |
| profiles       | select     | `src/pages/AdminReports.tsx:257` | RLS: `profiles_select_all`           | Resolve filtered username. `supabase/migrations/1004_policies_and_grants.sql:28`.                     |
| catches        | select     | `src/pages/AdminReports.tsx:352` | RLS: `catches_admin_read_all`        | Target lookup (includes deleted). `supabase/migrations/2016_phase1_admin_visibility.sql:33`.          |
| catch_comments | select     | `src/pages/AdminReports.tsx:369` | RLS: `catch_comments_admin_read_all` | Target lookup (includes deleted). `supabase/migrations/2016_phase1_admin_visibility.sql:46`.          |
| profiles       | select     | `src/pages/AdminReports.tsx:391` | RLS: `profiles_select_all`           | Fetch target profile + moderation fields. `supabase/migrations/1004_policies_and_grants.sql:28`.      |
| user_warnings  | select     | `src/pages/AdminReports.tsx:411` | RLS: `user_warnings_admin_read`      | Fetch warning history. `supabase/migrations/2016_phase1_admin_visibility.sql:73`.                     |
| moderation_log | select     | `src/pages/AdminReports.tsx:421` | RLS: `moderation_log_admin_read`     | Fetch moderation history. `supabase/migrations/2016_phase1_admin_visibility.sql:86`.                  |
| catch_comments | select     | `src/pages/AdminReports.tsx:580` | RLS: `catch_comments_admin_read_all` | Resolve `catch_id` for comment navigation. `supabase/migrations/2016_phase1_admin_visibility.sql:46`. |

### Storage

None found in route/feature files.

### Realtime

| Channel            | File                             | DB posture                                    | Notes                                                                                                                                                                                                |
| ------------------ | -------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| admin-reports-feed | `src/pages/AdminReports.tsx:275` | Realtime `postgres_changes` on public.reports | Subscription only set when `isAdmin` is true. Publication membership for `public.reports` is UNKNOWN and must be verified (Postgres Changes requires the table to be in `supabase_realtime`). Probe: |

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename = 'reports';
```

|

## Implicit DB side-effects

- `admin_update_report_status` updates `public.reports` and inserts `public.moderation_log`. `supabase/migrations/2072_admin_report_rpcs.sql:159`.
- `admin_delete_catch` / `admin_restore_catch` soft-delete/restore `public.catches`, insert `public.moderation_log`, and call `public.create_notification`. `supabase/migrations/1006_auth_and_rpc_helpers.sql:425`.
- `admin_delete_comment` / `admin_restore_comment` soft-delete/restore `public.catch_comments`, insert `public.moderation_log`, and call `public.create_notification`. `supabase/migrations/1006_auth_and_rpc_helpers.sql:585`.
- `admin_warn_user` inserts `public.user_warnings`, updates `public.profiles` moderation status, inserts `public.moderation_log`, and calls `public.create_notification`. `supabase/migrations/2048_moderation_notification_copy.sql:47`.

## Abuse & validation controls

- Admin gate: `useAdminAuth` blocks anon and non-admin users and redirects. `src/hooks/useAdminAuth.ts:20`.
- RPC guard: each admin RPC checks `admin_users` and raises `Admin privileges required` for non-admins. `supabase/migrations/2072_admin_report_rpcs.sql:87`.
- SECURITY DEFINER hygiene: verify each admin RPC has pinned `search_path` (e.g. `SET search_path TO ''`) and that EXECUTE grants are intentional.
- Critical dependency: `admin_users` is the source-of-truth for admin gating. Verify non-admin roles cannot write to `admin_users` (no INSERT/UPDATE/DELETE) and that RLS/write policies cannot be abused to self-elevate.

## Consistency note (shared hooks/components)

- `useAdminAuth` and `isAdminUser` are shared admin-gating helpers used in other admin surfaces. `src/hooks/useAdminAuth.ts`, `src/lib/admin.ts`.

## Test checklist

- Persona sweeps: Anon / Auth / Owner / Admin
- Expected allow/deny outcomes documented
- Evidence to capture: HAR + SQL + screenshots

## Decisions/Exceptions

- TBD

## Discovery methods

- Route discovery: `src/App.tsx` (createBrowserRouter / <Route>)
- Entrypoint discovery commands:
  - `rg -n "supabase\.rpc\(" src -S`
  - `rg -n "supabase\.from\(" src -S`
  - `rg -n "storage\.from\(" src -S`
  - `rg -n "channel\(|realtime" src -S`
  - `rg -n "<Route|createBrowserRouter|path=" src -S`
