# Admin Audit Log Pipeline (E2E)
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
- Route: `/admin/audit-log` (RequireAuth in `src/App.tsx:280`)
- Page: `src/pages/AdminAuditLog.tsx`
- Admin gate: `src/hooks/useAdminAuth.ts`
- Admin RPC: `public.admin_list_moderation_log` in `supabase/migrations/2072_admin_report_rpcs.sql:190`

## Surface narrative (step-by-step)
1) Route + auth gate
   - `/admin/audit-log` is wrapped by `RequireAuth` in the router. `src/App.tsx:280`.
   - `useAdminAuth` runs on mount; if no user, it toasts “Authentication required” and redirects to `/auth`. `src/hooks/useAdminAuth.ts:24`.
   - If user is not admin, it toasts “Admin access required” and redirects to `/feed`. `src/hooks/useAdminAuth.ts:31`.

2) Admin loading state
   - While `useAdminAuth` checks admin status, the page shows a spinner. `src/pages/AdminAuditLog.tsx:301`.
   - If `isAdmin` is false after the hook finishes, the component returns `null` (redirect already handled). `src/pages/AdminAuditLog.tsx:312`.

3) Initial state + query params
   - Default filters: `action=all`, `dateRange=7d`, `searchTerm=''`, `sort=desc`, `page=1`, `pageSize=100`. `src/pages/AdminAuditLog.tsx:150`.
   - `getQueryParams` converts filters into RPC params (`p_action`, `p_search`, `p_from`, `p_sort_direction`). `src/pages/AdminAuditLog.tsx:163`.

4) Initial load
   - `fetchAuditLogPage` calls `supabase.rpc('admin_list_moderation_log')` with limit/offset and current filters. `src/pages/AdminAuditLog.tsx:178`.
   - `fetchAuditLog` runs on load (when admin) and populates `logRows` after normalization; errors toast “Unable to load moderation log”. `src/pages/AdminAuditLog.tsx:198`.

5) Filter/search/pagination
   - Changing action/date/search resets page to 1 and triggers a fresh fetch through the `useEffect` dependency chain. `src/pages/AdminAuditLog.tsx:411` and `src/pages/AdminAuditLog.tsx:213`.
   - Pagination uses offset `(page - 1) * pageSize` and `canGoNext = logRows.length === pageSize`. `src/pages/AdminAuditLog.tsx:203` and `src/pages/AdminAuditLog.tsx:242`.
   - Sort toggle updates `p_sort_direction` (asc/desc). `src/pages/AdminAuditLog.tsx:297`.
   - Refresh button re-runs `fetchAuditLog`. `src/pages/AdminAuditLog.tsx:387`.

6) Realtime refresh
   - When admin, the page subscribes to `moderation-log-feed` and listens for `INSERT` on `public.moderation_log`. `src/pages/AdminAuditLog.tsx:219`.
   - On insert, it refreshes the list using current filters. `src/pages/AdminAuditLog.tsx:231`.

7) View target actions
   - For user targets, it fetches `profiles.username` via PostgREST and navigates to the profile path. `src/pages/AdminAuditLog.tsx:256`.
   - For comment targets, it fetches `catch_comments.catch_id` and navigates to `/catch/:id`. `src/pages/AdminAuditLog.tsx:267`.
   - Errors are shown with generic toasts (“Unable to open target/related comment”). `src/pages/AdminAuditLog.tsx:246`.

8) Export CSV
   - Export uses repeated `fetchAuditLogPage` calls to stream all rows matching current filters into a CSV file and downloads via `Blob` + `URL.createObjectURL`. `src/pages/AdminAuditLog.tsx:317`.
   - If no rows match, it toasts “No rows to export”. `src/pages/AdminAuditLog.tsx:331`.

9) Metadata redaction (client)
   - Metadata is sanitized by redacting sensitive keys and truncating values before display and export. `src/pages/AdminAuditLog.tsx:79`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| admin_list_moderation_log | p_user_id, p_action, p_search, p_from, p_to, p_sort_direction, p_limit, p_offset | `src/pages/AdminAuditLog.tsx:178` | Security definer function with admin check. `supabase/migrations/2072_admin_report_rpcs.sql:190`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| admin_users | select | `src/lib/admin.ts:14` | Admin gate (via `useAdminAuth` → `isAdminUser`). |
| profiles | select | `src/pages/AdminAuditLog.tsx:257` | Map user id to username on “View” action. |
| catch_comments | select | `src/pages/AdminAuditLog.tsx:268` | Resolve `catch_id` for comment targets. |

### Storage
- None found.

### Realtime
| Channel | Filters | File | Notes |
| --- | --- | --- | --- |
| moderation-log-feed | INSERT on public.moderation_log | `src/pages/AdminAuditLog.tsx:223` | Refreshes list on new log rows. |

### Third-party APIs
- None. (Browser APIs used for export: `Blob`, `URL.createObjectURL`.)

## Implicit DB side-effects
- No writes are issued from this surface. No triggers/functions are invoked by client writes.
- `admin_list_moderation_log` is `SECURITY DEFINER` with `SET search_path = public, extensions` and performs an internal admin check before returning rows. `supabase/migrations/2072_admin_report_rpcs.sql:190`.

## Security posture notes (facts only)
- Access enforcement: `RequireAuth` (router) + `useAdminAuth` client gate + admin check inside `admin_list_moderation_log` RPC. `src/App.tsx:280`, `src/hooks/useAdminAuth.ts:20`, `supabase/migrations/2072_admin_report_rpcs.sql:217`.
- RLS: `moderation_log_admin_read` policy exists for `public.moderation_log` (admin-only read). `supabase/migrations/2016_phase1_admin_visibility.sql:86`.
- RPC execution is granted to `authenticated`, but the function enforces admin privileges server-side. `supabase/migrations/2072_admin_report_rpcs.sql:254`.
- IDOR surfaces: `p_user_id`, `p_search`, `p_action`, `p_from`, `p_to`, `p_limit`, `p_offset` are server parameters; only admins can call the RPC.
- PostgREST lookups for `profiles` and `catch_comments` are RLS-governed; missing/denied rows show generic UI errors.
- No rate-limit or abuse throttling is visible in this surface or RPC.

## Repro commands used
```
rg -n "AdminAuditLog|audit log|AuditLog" src -S
rg -n "supabase\.rpc\(|supabase\.from\(" src/pages src/components src/lib src/hooks -S
rg -n "moderation_log|admin_list|audit|reports|warnings" supabase/migrations -S
rg -n "Realtime|channel\(" src -S
rg -n "useAdminAuth|isAdminUser" src -S
rg -n "admin_list_moderation_log" supabase/migrations -S
```
