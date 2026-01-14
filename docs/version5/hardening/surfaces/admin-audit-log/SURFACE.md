# Surface: admin-audit-log

## Route patterns

- `/admin/audit-log`

## Router entry files

- `src/App.tsx`
- `src/pages/AdminAuditLog.tsx`

## Personas

- Admin only. Anon users are redirected to `/auth`. Authenticated non-admins (Normal/Owner) are redirected to `/feed` with a toast. Admins can access and query the audit log.

## Deny UX

- Anon: `useAdminAuth` toasts “Authentication required” and navigates to `/auth`. `src/hooks/useAdminAuth.ts:24`.
- Auth non-admin: `useAdminAuth` toasts “Admin access required” and navigates to `/feed`. `src/hooks/useAdminAuth.ts:35`.
- While admin check runs, page shows a loading spinner; if not admin after check, component renders `null`. `src/pages/AdminAuditLog.tsx:301`.

## Entrypoints

### RPCs

| RPC                       | File                              | DB posture                                                               | Notes                                                                                                                                     |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| admin_list_moderation_log | `src/pages/AdminAuditLog.tsx:178` | SECURITY DEFINER + internal admin check (GRANT EXECUTE to authenticated) | Filters: p_user_id/p_action/p_search/p_from/p_to/p_sort_direction/p_limit/p_offset. `supabase/migrations/2072_admin_report_rpcs.sql:190`. |

### PostgREST

| Table          | Operations | File                              | DB posture                                             | Notes                                                                                            |
| -------------- | ---------- | --------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| admin_users    | select     | `src/lib/admin.ts:14`             | RLS (admin check)                                      | Used by `useAdminAuth` → `isAdminUser`.                                                          |
| profiles       | select     | `src/pages/AdminAuditLog.tsx:257` | RLS: `profiles_select_all`                             | Resolve username for “View” user targets. `supabase/migrations/1004_policies_and_grants.sql:28`. |
| catch_comments | select     | `src/pages/AdminAuditLog.tsx:268` | RLS: `catch_comments_public_read` (deleted_at IS NULL) | Resolve `catch_id` for comment targets. `supabase/migrations/1004_policies_and_grants.sql:60`.   |

### Storage

None found in route/feature files.

### Realtime

| Channel             | File                              | DB posture                                           | Notes                                                                                                                                                                                                   |
| ------------------- | --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| moderation-log-feed | `src/pages/AdminAuditLog.tsx:223` | Realtime `postgres_changes` on public.moderation_log | Subscription only set when `isAdmin` is true. Current probe: `public.moderation_log` is not in the `supabase_realtime` publication (so Postgres Changes will not stream it unless added intentionally). |

## Implicit DB side-effects

- No client writes in this surface; no triggers are invoked by this UI.
- `admin_list_moderation_log` is a SECURITY DEFINER function with a pinned `search_path` and an internal admin check (raises `Admin privileges required` for non-admin). See `supabase/migrations/2072_admin_report_rpcs.sql` for definition + grants.

## Abuse & validation controls

- Admin gate: `useAdminAuth` blocks anon and non-admin users and redirects. `src/hooks/useAdminAuth.ts:20`.
- RPC guard: `admin_list_moderation_log` checks `admin_users` and raises `Admin privileges required` for non-admin. `supabase/migrations/2072_admin_report_rpcs.sql:217`.
- Metadata redaction: sensitive keys are redacted and long values truncated before display/export. `src/pages/AdminAuditLog.tsx:79`.
- No explicit rate limits or throttles observed in this surface or RPC.

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
