# Admin Reports Pipeline (E2E)
<!-- PHASE-GATES:START -->
## Phase Gates

| Gate | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Contract & personas defined | TODO | (link to section below) | |
| Data entrypoints inventoried (tables/RPC/storage/realtime) | TODO | | |
| Anti-enumeration UX verified | TODO | | |
| RLS/policies verified for surface tables | TODO | | |
| Grants verified (least privilege) | TODO | | |
| RPC posture verified (EXECUTE + SECURITY DEFINER hygiene if used) | TODO | | |
| Manual UX pass (4 personas) | TODO | HAR + screenshots | |
| SQL probe evidence captured | TODO | CSV/SQL outputs | |
| Result | TODO | | PASS / FAIL |
<!-- PHASE-GATES:END -->

<!-- PERSONA-CONTRACT-REF:START -->
Persona contract: `docs/version5/hardening/_global/legacy/PERSONA-PERMISSIONS.md`
<!-- PERSONA-CONTRACT-REF:END -->


## Scope
- Route: `/admin/reports` (RequireAuth in `src/App.tsx:272`)
- Page: `src/pages/AdminReports.tsx`
- Admin gate: `src/hooks/useAdminAuth.ts`
- Admin RPCs:
  - `public.admin_list_reports` in `supabase/migrations/2072_admin_report_rpcs.sql:54`
  - `public.admin_update_report_status` in `supabase/migrations/2072_admin_report_rpcs.sql:139`
  - `public.admin_delete_catch` in `supabase/migrations/1006_auth_and_rpc_helpers.sql:392`
  - `public.admin_restore_catch` in `supabase/migrations/1006_auth_and_rpc_helpers.sql:472`
  - `public.admin_delete_comment` in `supabase/migrations/1006_auth_and_rpc_helpers.sql:552`
  - `public.admin_restore_comment` in `supabase/migrations/1006_auth_and_rpc_helpers.sql:632`
  - `public.admin_warn_user` redefined in `supabase/migrations/2048_moderation_notification_copy.sql:9`

## Surface narrative (step-by-step)
1) Route + auth gate
   - `/admin/reports` is wrapped by `RequireAuth` in the router. `src/App.tsx:272`.
   - `useAdminAuth` runs on mount; if no user, it toasts "Authentication required" and redirects to `/auth`. `src/hooks/useAdminAuth.ts:24`.
   - If user is not admin, it toasts "Admin access required" and redirects to `/feed`. `src/hooks/useAdminAuth.ts:35`.

2) Admin loading state
   - While `useAdminAuth` checks admin status, the page shows a spinner. `src/pages/AdminReports.tsx:808`.
   - If `isAdmin` is false after the hook finishes, the component returns `null` (redirect already handled). `src/pages/AdminReports.tsx:819`.

3) Initial state + filters
   - Default filters: `filter=all`, `status=open`, `sort=newest`, `dateRange=7d`, `page=1`, `pageSize=20`. `src/pages/AdminReports.tsx:148`.
   - `location.state.filterUserId` or query params `reportedUserId`/`userId` set `filteredUserId` and reset page. `src/pages/AdminReports.tsx:234`.
   - When `filteredUserId` is set, it resolves a username via `profiles` for display. `src/pages/AdminReports.tsx:251`.

4) Initial load
   - `fetchReports` calls `supabase.rpc('admin_list_reports')` with status/type/user/date/sort/paging params. `src/pages/AdminReports.tsx:193`.
   - Errors toast "Unable to load reports"; success normalizes and stores rows in local state. `src/pages/AdminReports.tsx:207`.

5) Filter/pagination behavior
   - `fetchReports` depends on `statusFilter`, `filter`, `sortOrder`, `dateRange`, `page`, and `filteredUserId`; when these change, `useEffect` re-runs the query. `src/pages/AdminReports.tsx:231`.
   - Pagination uses `p_limit=pageSize` and `p_offset=(page - 1) * pageSize`. `src/pages/AdminReports.tsx:202`.
   - "Previous"/"Next" buttons update `page`, with `canLoadMore = reports.length === pageSize * page`. `src/pages/AdminReports.tsx:737`.

6) Realtime refresh
   - When admin, the page subscribes to `admin-reports-feed` with `postgres_changes` INSERT/UPDATE/DELETE on `public.reports`. `src/pages/AdminReports.tsx:274`.
   - On each event, it re-fetches the list silently. `src/pages/AdminReports.tsx:283`.

7) Report selection + details
   - Selecting a report triggers `fetchReportDetails`, which gathers target data from `catches` or `catch_comments`, then target profile details, user warnings, and moderation history. `src/pages/AdminReports.tsx:336`.
   - Errors show a generic toast ("Unable to load moderation details"). `src/pages/AdminReports.tsx:519`.

8) View target actions
   - `handleViewTarget` navigates to `/catch/:id` for catch reports and profile routes for profile reports. `src/pages/AdminReports.tsx:561`.
   - For comment reports without a cached catch id, it looks up `catch_comments.catch_id` before navigating. `src/pages/AdminReports.tsx:580`.
   - Errors show a toast ("Unable to open reported comment"). `src/pages/AdminReports.tsx:586`.

9) Admin actions (writes)
   - Update report status: `admin_update_report_status` updates `public.reports` and inserts into `public.moderation_log`. `src/pages/AdminReports.tsx:532`, `supabase/migrations/2072_admin_report_rpcs.sql:159`.
   - Delete content: `admin_delete_catch` / `admin_delete_comment` soft-delete content, log to `moderation_log`, and create notifications. `src/pages/AdminReports.tsx:610`, `supabase/migrations/1006_auth_and_rpc_helpers.sql:392`.
   - Restore content: `admin_restore_catch` / `admin_restore_comment` remove soft-delete, log to `moderation_log`, and create notifications. `src/pages/AdminReports.tsx:650`, `supabase/migrations/1006_auth_and_rpc_helpers.sql:472`.
   - Warn user: `admin_warn_user` inserts `user_warnings`, updates `profiles`, logs to `moderation_log`, and creates notifications. `src/pages/AdminReports.tsx:716`, `supabase/migrations/2048_moderation_notification_copy.sql:47`.

10) Export behavior
   - No export (CSV/JSON/download) is implemented in this surface.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| admin_list_reports | p_status, p_type, p_reported_user_id, p_from, p_to, p_sort_direction, p_limit, p_offset | `src/pages/AdminReports.tsx:193` | SECURITY DEFINER + admin check. `supabase/migrations/2072_admin_report_rpcs.sql:54`. |
| admin_update_report_status | p_report_id, p_status, p_resolution_notes | `src/pages/AdminReports.tsx:532` | SECURITY DEFINER; updates reports + inserts moderation_log. `supabase/migrations/2072_admin_report_rpcs.sql:139`. |
| admin_delete_catch | p_catch_id, p_reason | `src/pages/AdminReports.tsx:610` | SECURITY DEFINER; soft-deletes catch + moderation_log + notification. `supabase/migrations/1006_auth_and_rpc_helpers.sql:392`. |
| admin_delete_comment | p_comment_id, p_reason | `src/pages/AdminReports.tsx:616` | SECURITY DEFINER; soft-deletes comment + moderation_log + notification. `supabase/migrations/1006_auth_and_rpc_helpers.sql:552`. |
| admin_restore_catch | p_catch_id, p_reason | `src/pages/AdminReports.tsx:650` | SECURITY DEFINER; restores catch + moderation_log + notification. `supabase/migrations/1006_auth_and_rpc_helpers.sql:472`. |
| admin_restore_comment | p_comment_id, p_reason | `src/pages/AdminReports.tsx:660` | SECURITY DEFINER; restores comment + moderation_log + notification. `supabase/migrations/1006_auth_and_rpc_helpers.sql:632`. |
| admin_warn_user | p_user_id, p_reason, p_severity, p_duration_hours | `src/pages/AdminReports.tsx:716` | SECURITY DEFINER; inserts warning + updates profiles + moderation_log + notification. `supabase/migrations/2048_moderation_notification_copy.sql:9`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| admin_users | select | `src/lib/admin.ts:14` | Admin gate via `isAdminUser`. RLS: `admin_users_self_select`. `supabase/migrations/2016_phase1_admin_visibility.sql:20`. |
| profiles | select | `src/pages/AdminReports.tsx:257` | Resolve filtered username. RLS: `profiles_select_all`. `supabase/migrations/1004_policies_and_grants.sql:28`. |
| catches | select | `src/pages/AdminReports.tsx:352` | Fetch catch target details. RLS: `catches_admin_read_all`. `supabase/migrations/2016_phase1_admin_visibility.sql:33`. |
| catch_comments | select | `src/pages/AdminReports.tsx:369` | Fetch comment target details. RLS: `catch_comments_admin_read_all`. `supabase/migrations/2016_phase1_admin_visibility.sql:46`. |
| profiles | select | `src/pages/AdminReports.tsx:391` | Fetch target profile + moderation fields. RLS: `profiles_select_all`. |
| user_warnings | select | `src/pages/AdminReports.tsx:411` | Fetch warning history. RLS: `user_warnings_admin_read`. `supabase/migrations/2016_phase1_admin_visibility.sql:73`. |
| moderation_log | select | `src/pages/AdminReports.tsx:421` | Fetch moderation history. RLS: `moderation_log_admin_read`. `supabase/migrations/2016_phase1_admin_visibility.sql:86`. |
| catch_comments | select | `src/pages/AdminReports.tsx:580` | Resolve `catch_id` for comment navigation. RLS: `catch_comments_admin_read_all`. |

### Storage
- None found.

### Realtime
| Channel | Filters | File | Notes |
| --- | --- | --- | --- |
| admin-reports-feed | INSERT/UPDATE/DELETE on public.reports | `src/pages/AdminReports.tsx:275` | Refreshes list on new report activity; verify publication membership for `public.reports`. |

### Third-party APIs
- None.

## Implicit DB side-effects
- `admin_update_report_status` updates `public.reports` (status, reviewed_by, reviewed_at, resolution_notes) and inserts `moderation_log` action `update_report_status`. `supabase/migrations/2072_admin_report_rpcs.sql:159`.
- `admin_delete_catch` / `admin_restore_catch` soft-delete/restore `public.catches`, insert `moderation_log`, and call `public.create_notification`. `supabase/migrations/1006_auth_and_rpc_helpers.sql:425`.
- `admin_delete_comment` / `admin_restore_comment` soft-delete/restore `public.catch_comments`, insert `moderation_log`, and call `public.create_notification`. `supabase/migrations/1006_auth_and_rpc_helpers.sql:585`.
- `admin_warn_user` inserts `public.user_warnings`, updates `public.profiles` moderation status, inserts `moderation_log`, and calls `public.create_notification`. `supabase/migrations/2048_moderation_notification_copy.sql:47`.
- `admin_list_reports` is read-only; it joins `reports` to `profiles`/`catches`/`catch_comments` to compute reporter and reported users. `supabase/migrations/2072_admin_report_rpcs.sql:92`.

## Security posture notes (facts only)
- Access enforcement: `RequireAuth` (router) + `useAdminAuth` client gate + admin check inside each admin RPC. `src/App.tsx:272`, `src/hooks/useAdminAuth.ts:20`, `supabase/migrations/2072_admin_report_rpcs.sql:83`, `supabase/migrations/1006_auth_and_rpc_helpers.sql:406`.
- RLS policies: `reports_admin_all`, `catches_admin_read_all`, `catch_comments_admin_read_all`, `user_warnings_admin_read`, `moderation_log_admin_read`, `profiles_select_all`, `admin_users_self_select`. `supabase/migrations/2016_phase1_admin_visibility.sql` and `supabase/migrations/1004_policies_and_grants.sql`.
- RPC execution is granted to `authenticated`, but each function raises `Admin privileges required` for non-admins. `supabase/migrations/2072_admin_report_rpcs.sql:128`, `supabase/migrations/1006_auth_and_rpc_helpers.sql:853`.
- IDOR surfaces: client passes `p_reported_user_id`, `p_report_id`, `p_catch_id`, `p_comment_id`, `p_user_id`. Only admins can invoke, but inputs are user-controlled in the admin UI.
- Realtime uses `postgres_changes` on `public.reports`; table must be in the `supabase_realtime` publication for events to stream.
- No explicit rate limits are present in the admin RPCs used here.

## Repro commands used
```
rg -n "AdminReports|admin reports|Reports" src -S
rg -n "supabase\.rpc\(|supabase\.from\(" src/pages src/components src/lib src/hooks -S
rg -n "postgres_changes|channel\(" src -S
rg -n "admin_list_reports|admin_update_report_status|admin_delete_catch|admin_delete_comment|admin_restore_catch|admin_restore_comment|admin_warn_user" supabase/migrations -S
rg -n "useAdminAuth|isAdminUser" src -S
rg -n "reports_admin_all|catches_admin_read_all|catch_comments_admin_read_all|user_warnings_admin_read|moderation_log_admin_read|admin_users_self_select|profiles_select_all" supabase/migrations -S
```
