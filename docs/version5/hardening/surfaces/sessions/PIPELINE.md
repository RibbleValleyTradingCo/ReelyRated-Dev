# Sessions Pipeline (E2E)
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
- Route: `/sessions` (auth required). `src/App.tsx:264-270`.
- Page: `src/pages/Sessions.tsx` (Sessions component).
- Auth gate: `RequireAuth` redirects unauthenticated users to `/auth`. `src/App.tsx:58-69`.
- Deleted account gate: `DeletedAccountGate` checks `profiles.is_deleted` and signs out + redirects to `/account-deleted`. `src/components/Layout.tsx:9-16`, `src/components/DeletedAccountGate.tsx:49-67`.
- Related surfaces / handoffs: `/feed`, `/add-catch`, `/feed?session=<id>`. `src/pages/Sessions.tsx:78-83`, `src/pages/Sessions.tsx:148-152`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `RequireAuth` shows `RouteSkeleton` while loading and redirects to `/auth` when no user. `src/App.tsx:58-69`, `src/App.tsx:264-270`.
   - `DeletedAccountGate` runs inside the layout and checks `profiles.is_deleted`; deleted accounts are signed out and redirected to `/account-deleted`. `src/components/DeletedAccountGate.tsx:49-67`.
   - The page also runs a local redirect to `/auth` when `useAuth` resolves to no user (redundant UX guard). `src/pages/Sessions.tsx:33-36`.

2) Initial load
   - When a user exists, the page queries the `sessions` table for that user and orders by `date` and `created_at` descending. `src/pages/Sessions.tsx:40-48`.
   - Results populate the local `sessions` state; loading state is toggled off regardless of errors. `src/pages/Sessions.tsx:40-53`.

3) Admin check (UI-only)
   - The page calls `isAdminUser` to decide whether to show the "Log a catch" button. `src/pages/Sessions.tsx:58-64`, `src/pages/Sessions.tsx:79-83`, `src/lib/admin.ts:10-18`.

4) UI states and navigation
   - Loading state shows "Loading sessions..." while the fetch runs. `src/pages/Sessions.tsx:90-96`.
   - Empty state shows "No sessions yet..." when the list is empty. `src/pages/Sessions.tsx:98-106`.
   - Each session card links to `/feed?session=<id>` to view that session's catches. `src/pages/Sessions.tsx:148-152`.

## Entrypoints inventory (with file:line)

### RPCs
- None observed.

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| sessions | select | `src/pages/Sessions.tsx:43-48` | Filtered by `user_id = auth user`. |
| catches | select (count only via FK join) | `src/pages/Sessions.tsx:45` | `catches:catches_session_id_fkey(count)` join. |
| admin_users | select | `src/lib/admin.ts:14-18` | Admin check used for UI only. |
| profiles | select `is_deleted` | `src/components/DeletedAccountGate.tsx:49-53` | Global gate applied in layout. |

### Storage
- None.

### Realtime
- None.

### Third-party APIs
- None.

## Implicit DB side-effects
- None (read-only surface).

## Security posture notes (facts only)
- `/sessions` is auth-only via `RequireAuth`. `src/App.tsx:58-69`, `src/App.tsx:264-270`.
- `DeletedAccountGate` signs out and redirects deleted accounts based on `profiles.is_deleted`. `src/components/DeletedAccountGate.tsx:49-67`.
- The `sessions` query is filtered client-side by `user_id`; RLS must enforce that users can only read their own sessions and related `catches` count. `src/pages/Sessions.tsx:43-46`.
- `isAdminUser` is used only to hide the "Log a catch" button; it does not enforce data access. `src/pages/Sessions.tsx:58-64`, `src/lib/admin.ts:10-18`.

## SQL queries to run during sweep
```
-- Grants for touched tables
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('sessions', 'catches', 'admin_users', 'profiles');

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in ('sessions', 'catches', 'admin_users', 'profiles');
```

## Open verification items
- Confirm RLS on `sessions` restricts reads to the session owner.
- Confirm `catches` RLS does not leak counts for sessions owned by other users.
- Confirm `admin_users` RLS allows only admins to read their own admin row (or a minimal safe policy).

## Repro commands used
```
cat docs/version5/hardening/surfaces/sessions/PIPELINE.md
nl -ba src/App.tsx | sed -n '50,80p'
nl -ba src/App.tsx | sed -n '250,290p'
nl -ba src/components/Layout.tsx
nl -ba src/components/DeletedAccountGate.tsx
nl -ba src/pages/Sessions.tsx
nl -ba src/lib/admin.ts
```
