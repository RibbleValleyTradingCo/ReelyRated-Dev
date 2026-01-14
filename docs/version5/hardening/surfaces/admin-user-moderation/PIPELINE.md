# Admin User Moderation Pipeline (E2E)
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
- Route: `/admin/users/:userId/moderation` (RequireAuth in `src/App.tsx:289`)
- Page: `src/pages/AdminUserModeration.tsx`
- Admin gate: `src/hooks/useAdminAuth.ts`
- Admin RPCs:
  - `public.admin_list_moderation_log` in `supabase/migrations/2072_admin_report_rpcs.sql:190`
  - `public.admin_warn_user` in `supabase/migrations/2048_moderation_notification_copy.sql:9`
  - `public.admin_clear_moderation_status` in `supabase/migrations/2048_moderation_notification_copy.sql:141`

## Surface narrative (step-by-step)
1) Route + auth gate
   - `/admin/users/:userId/moderation` is wrapped by `RequireAuth` in the router. `src/App.tsx:289`.
   - `useAdminAuth` runs on mount; if no user, it toasts "Authentication required" and redirects to `/auth`. `src/hooks/useAdminAuth.ts:24`.
   - If user is not admin, it toasts "Admin access required" and redirects to `/feed`. `src/hooks/useAdminAuth.ts:35`.

2) Admin loading state
   - While `useAdminAuth` checks admin status, the page shows a spinner. `src/pages/AdminUserModeration.tsx:479`.
   - If `isAdmin` is false after the hook finishes, the component returns `null` (redirect already handled). `src/pages/AdminUserModeration.tsx:489`.

3) Initial state + pagination
   - Page sizes: `WARNINGS_PAGE_SIZE = 20`, `LOG_PAGE_SIZE = 20`. `src/pages/AdminUserModeration.tsx:52`.
   - State tracks `warningsPage`, `logPage`, and `refreshKey` for reloads. `src/pages/AdminUserModeration.tsx:75`.

4) Initial load (per userId)
   - When `userId` changes, state resets and both lists are cleared. `src/pages/AdminUserModeration.tsx:207`.
   - `fetchProfile` reads the target profile moderation status via `profiles` and stores it in `profileStatus`. `src/pages/AdminUserModeration.tsx:95`.
   - `fetchWarnings` reads `user_warnings` for the target user and paginates with `.range(...)`. `src/pages/AdminUserModeration.tsx:127`.
   - `fetchLog` calls `admin_list_moderation_log` with `p_user_id`, `p_limit`, and `p_offset` to load the audit history. `src/pages/AdminUserModeration.tsx:164`.
   - Errors show generic toasts ("Unable to load user moderation status" / "Unable to load warnings" / "Unable to load moderation history"). `src/pages/AdminUserModeration.tsx:109`.

5) Warnings pagination
   - "Load more warnings" increments `warningsPage`, and the next page is appended to existing rows. `src/pages/AdminUserModeration.tsx:282`.
   - `warningsHasMore` is true when the page length equals `WARNINGS_PAGE_SIZE`. `src/pages/AdminUserModeration.tsx:150`.

6) Moderation log pagination
   - "Load more history" increments `logPage`, and the next page is appended. `src/pages/AdminUserModeration.tsx:365`.
   - `logHasMore` is true when the page length equals `LOG_PAGE_SIZE`. `src/pages/AdminUserModeration.tsx:188`.

7) Refresh
   - `handleRefresh` clears cached rows, resets pagination, and increments `refreshKey` to re-trigger queries. `src/pages/AdminUserModeration.tsx:194`.

8) Apply moderation actions (warning/suspend/ban)
   - `applyModerationAction` validates reason and (if temporary suspension) duration, then calls `admin_warn_user`.
     - RPC payload includes `p_user_id`, `p_reason`, `p_severity`, and optional `p_duration_hours`. `src/pages/AdminUserModeration.tsx:404`.
   - On success it shows a toast and refreshes; on failure it shows "Unable to apply moderation action". `src/pages/AdminUserModeration.tsx:421`, `src/pages/AdminUserModeration.tsx:438`.

9) Lift restrictions
   - `handleLiftRestrictions` validates reason and calls `admin_clear_moderation_status` with `p_user_id` and `p_reason`. `src/pages/AdminUserModeration.tsx:459`.
   - On success it shows "Restrictions lifted" and refreshes; on failure it shows "Unable to lift restrictions". `src/pages/AdminUserModeration.tsx:467`, `src/pages/AdminUserModeration.tsx:473`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| admin_list_moderation_log | p_user_id, p_action, p_search, p_from, p_to, p_sort_direction, p_limit, p_offset | `src/pages/AdminUserModeration.tsx:164` | SECURITY DEFINER + admin check. `supabase/migrations/2072_admin_report_rpcs.sql:190`. |
| admin_warn_user | p_user_id, p_reason, p_severity, p_duration_hours | `src/pages/AdminUserModeration.tsx:418` | SECURITY DEFINER + admin check. Inserts `user_warnings` and writes `profiles` + `moderation_log`. `supabase/migrations/2048_moderation_notification_copy.sql:9`. |
| admin_clear_moderation_status | p_user_id, p_reason | `src/pages/AdminUserModeration.tsx:459` | SECURITY DEFINER + admin check. Updates `profiles` + `moderation_log`. `supabase/migrations/2048_moderation_notification_copy.sql:141`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| admin_users | select | `src/lib/admin.ts:14` | Admin gate via `useAdminAuth` -> `isAdminUser`. RLS: `admin_users_self_select`. `supabase/migrations/2016_phase1_admin_visibility.sql:20`. |
| profiles | select | `src/pages/AdminUserModeration.tsx:102` | Load moderation status + avatar. RLS: `profiles_select_all`. `supabase/migrations/1004_policies_and_grants.sql:28`. |
| user_warnings | select | `src/pages/AdminUserModeration.tsx:135` | Warning history. RLS: `user_warnings_admin_read`. `supabase/migrations/2016_phase1_admin_visibility.sql:73`. |

### Storage
- None found. Avatar URLs are derived locally via `resolveAvatarUrl` (public URL), not storage API calls.

### Realtime
- None found.

### Third-party APIs
- None.

## Writes + side effects
- `admin_warn_user` inserts `public.user_warnings`, updates `public.profiles` moderation fields, inserts `public.moderation_log`, and calls `public.create_notification`. `supabase/migrations/2048_moderation_notification_copy.sql:47`.
- `admin_clear_moderation_status` updates `public.profiles`, inserts `public.moderation_log`, and calls `public.create_notification`. `supabase/migrations/2048_moderation_notification_copy.sql:169`.
- `admin_list_moderation_log` is read-only; it returns moderation history joined with admin profiles. `supabase/migrations/2072_admin_report_rpcs.sql:226`.

## Abuse controls / bounds
- Pagination: warnings and log lists use page size 20; warnings use `.range(...)`, and log uses `p_limit`/`p_offset`. `src/pages/AdminUserModeration.tsx:52`.
- Client validation: reason is required; temporary suspension requires a positive duration. `src/pages/AdminUserModeration.tsx:390`.
- Error handling is generic for load and action failures (toasts do not expose object existence). `src/pages/AdminUserModeration.tsx:109`.
- Moderation metadata is returned via `admin_list_moderation_log`; UI derives `reason` from `metadata` and truncates to 120 chars via `truncate`. `src/pages/AdminUserModeration.tsx:182`, `src/pages/AdminUserModeration.tsx:56`.
- No explicit rate limits or throttles are present in these admin RPCs.

## Security posture notes (facts only)
- Access enforcement: `RequireAuth` (router) + `useAdminAuth` client gate + admin checks inside each admin RPC. `src/App.tsx:289`, `src/hooks/useAdminAuth.ts:20`.
- `admin_list_moderation_log`, `admin_warn_user`, and `admin_clear_moderation_status` are SECURITY DEFINER functions with `SET search_path = public, extensions`. `supabase/migrations/2072_admin_report_rpcs.sql:252`, `supabase/migrations/2048_moderation_notification_copy.sql:18`, `supabase/migrations/2048_moderation_notification_copy.sql:148`.
- RLS policies exist for `user_warnings` and `moderation_log` admin reads; profile status reads use `profiles_select_all`. `supabase/migrations/2016_phase1_admin_visibility.sql:73`, `supabase/migrations/1004_policies_and_grants.sql:28`.

## Repro commands used
```
rg -n "AdminUserModeration|user moderation|user-moderation" src -S
rg -n "supabase\.rpc\(|supabase\.from\(" src/pages/AdminUserModeration.tsx -S
rg -n "admin_list_moderation_log|admin_warn_user|admin_clear_moderation_status" supabase/migrations -S
rg -n "useAdminAuth|isAdminUser" src -S
rg -n "profiles_select_all|user_warnings_admin_read|moderation_log_admin_read|admin_users_self_select" supabase/migrations -S
```
