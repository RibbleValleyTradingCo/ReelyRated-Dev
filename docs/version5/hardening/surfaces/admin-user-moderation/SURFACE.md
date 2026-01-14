# Surface: admin-user-moderation

## Route patterns

- `/admin/users/:userId/moderation` (`:userId` is a UUID)

## Router entry files

- `src/App.tsx`
- `src/pages/AdminUserModeration.tsx`

## Personas

- Anon: denied (redirect to `/auth`).
- Normal: denied (redirect to `/feed`).
- Owner: denied (redirect to `/feed`).
- Private: denied (redirect to `/feed`).
- Blocked: denied (redirect to `/feed`).
- Admin: allowed.

## Deny UX

- Anon: `useAdminAuth` toasts "Authentication required" and navigates to `/auth`. `src/hooks/useAdminAuth.ts:24`.
- Auth non-admin (Normal/Owner/Private/Blocked): `useAdminAuth` toasts "Admin access required" and navigates to `/feed`. `src/hooks/useAdminAuth.ts:35`.
- While admin check runs, page shows a loading spinner; if not admin after check, component renders `null`. `src/pages/AdminUserModeration.tsx:479`.
- If `isAdmin` is false after the check, the component returns `null` (redirect already handled). `src/pages/AdminUserModeration.tsx:489`.

## Entrypoints

### RPCs

| RPC                           | File                                    | DB posture                                                               | Notes                                                                                                                                                                                                                                                |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| admin_list_moderation_log     | `src/pages/AdminUserModeration.tsx:164` | SECURITY DEFINER + internal admin check (GRANT EXECUTE to authenticated) | Filters: p_user_id/p_action/p_search/p_from/p_to/p_sort_direction/p_limit/p_offset. Treat `:userId`/filter params as attacker-controlled; avoid enumeration via distinct error shapes/timings. `supabase/migrations/2072_admin_report_rpcs.sql:190`. |
| admin_warn_user               | `src/pages/AdminUserModeration.tsx:418` | SECURITY DEFINER + internal admin check                                  | Inserts warnings + updates profiles + moderation_log + notification. `supabase/migrations/2048_moderation_notification_copy.sql:9`.                                                                                                                  |
| admin_clear_moderation_status | `src/pages/AdminUserModeration.tsx:459` | SECURITY DEFINER + internal admin check                                  | Clears moderation status + inserts moderation_log + notification. `supabase/migrations/2048_moderation_notification_copy.sql:141`.                                                                                                                   |

### PostgREST

| Table         | Operations | File                                    | DB posture                      | Notes                                                                                                                                                                                                                                |
| ------------- | ---------- | --------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| admin_users   | select     | `src/lib/admin.ts:14`                   | RLS: `admin_users_self_select`  | Admin gate via `useAdminAuth` -> `isAdminUser`. `supabase/migrations/2016_phase1_admin_visibility.sql:20`.                                                                                                                           |
| profiles      | select     | `src/pages/AdminUserModeration.tsx:103` | RLS: `profiles_select_all`      | Load moderation status + avatar. Followup: confirm `profiles_select_all` does not expose sensitive fields to non-admin roles; this surface must not rely on client redaction. `supabase/migrations/1004_policies_and_grants.sql:28`. |
| user_warnings | select     | `src/pages/AdminUserModeration.tsx:135` | RLS: `user_warnings_admin_read` | Warning history. `supabase/migrations/2016_phase1_admin_visibility.sql:73`.                                                                                                                                                          |

### Storage

None found in route/feature files.

### Realtime

None found in route/feature files.

## Implicit DB side-effects

- `admin_warn_user` inserts `public.user_warnings`, updates `public.profiles`, inserts `public.moderation_log`, and calls `public.create_notification`. `supabase/migrations/2048_moderation_notification_copy.sql:47`.
- `admin_clear_moderation_status` updates `public.profiles`, inserts `public.moderation_log`, and calls `public.create_notification`. `supabase/migrations/2048_moderation_notification_copy.sql:169`.

## Security posture notes

- Authorization is enforced server-side per RPC (admin checks inside each RPC) and by RLS on PostgREST reads. `supabase/migrations/2072_admin_report_rpcs.sql:190`, `supabase/migrations/2016_phase1_admin_visibility.sql:73`.
- Client-side `useAdminAuth` is a UX gate (redirect/toast) and must not be treated as the security boundary.
- RPCs used here are SECURITY DEFINER. Followups should confirm: (a) object references inside the function bodies are schema-qualified, and (b) `search_path` is set defensively to exclude schemas writable by untrusted users (and ensure `pg_temp` is searched last). Where feasible, prefer `SET search_path = ''` + full schema-qualification for maximum safety. `supabase/migrations/2072_admin_report_rpcs.sql:252`, `supabase/migrations/2048_moderation_notification_copy.sql:18`, `supabase/migrations/2048_moderation_notification_copy.sql:148`.
- Confirm EXECUTE is not granted to `PUBLIC` for these SECURITY DEFINER RPCs; revoke default PUBLIC privileges and re-grant only the intended roles within a single transaction.
- Admin gate relies on `admin_users_self_select` to confirm admin membership. `supabase/migrations/2016_phase1_admin_visibility.sql:20`.

## Abuse & validation controls

- Client validation: reason required; temporary suspension requires positive duration. `src/pages/AdminUserModeration.tsx:390`.
- Pagination: warnings and log lists use page size 20; log uses RPC limit/offset. `src/pages/AdminUserModeration.tsx:52`.
- No explicit rate limits or throttles observed in these admin RPCs.

## Test checklist

- Persona sweeps: Anon / Normal / Owner / Private / Blocked / Admin
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

### SQL probes (quick)

- Function security + search_path:

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

- EXECUTE grants (ensure no PUBLIC execute):
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
