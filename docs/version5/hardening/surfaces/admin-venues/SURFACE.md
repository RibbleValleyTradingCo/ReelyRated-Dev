# Surface: admin-venues

## Route patterns

- `/admin/venues`

## Router entry files

- `src/App.tsx`
- `src/pages/AdminVenuesList.tsx`

## Personas

- Anon: denied (redirect to `/auth`).
- Normal: denied (redirect to `/`).
- Owner: denied (redirect to `/`).
- Private: denied (redirect to `/`).
- Blocked: denied (redirect to `/`).
- Admin: allowed.

> Consistency note: This surface currently redirects **auth non-admins** to `/` (home). Some other admin surfaces may redirect to `/feed`. If you standardize deny routing across admin surfaces, update this section and record the decision in `docs/version5/hardening/DECISIONS-AND-EXCEPTIONS.md`.

## Deny UX

- Anon: `RequireAuth` redirects to `/auth` (no toast). `src/App.tsx:67`.
- Auth non-admin: `checkAdmin` toasts "You must be an admin to view this page." and navigates to `/` (home). `src/pages/AdminVenuesList.tsx:55`.
- If `admin_get_venues` returns an admin/unauthorized error, the same toast + `/` redirect is used. `src/pages/AdminVenuesList.tsx:90`.
- Unauthorized UI renders "Access denied" and "You don't have permission to view this page." with a "Back to home" link. `src/pages/AdminVenuesList.tsx:153`.

## Entrypoints

### RPCs

| RPC              | File                               | DB posture                                                                 | Notes                                                                                                                                                                           |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| admin_get_venues | `src/pages/AdminVenuesList.tsx:80` | SECURITY INVOKER + internal admin check (EXECUTE granted to authenticated) | Params: p_search/p_limit/p_offset. Joins `public.venues` + `public.venue_stats`, orders by name, bounds limit/offset. `supabase/migrations/2153_admin_venues_hardening.sql:12`. |

### PostgREST

| Table       | Operations | File                  | DB posture                     | Notes                                                                                    |
| ----------- | ---------- | --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| admin_users | select     | `src/lib/admin.ts:14` | RLS: `admin_users_self_select` | Admin gate via `isAdminUser`. `supabase/migrations/2016_phase1_admin_visibility.sql:20`. |

### Storage

None found in route/feature files.

### Realtime

None found in route/feature files.

## Implicit DB side-effects

- None. Surface is read-only (RPC returns data only).

## Security posture notes

- Client admin checks are UX-only; `admin_get_venues` is SECURITY INVOKER so RLS + grants on `public.venues`/`public.venue_stats` must be correct to enforce access. `supabase/migrations/2153_admin_venues_hardening.sql:41`, `supabase/migrations/2086_venues_rls.sql:71`.
- `admin_get_venues` uses `SET search_path = public, extensions`; confirm schema qualification and search_path posture during sweep. `supabase/migrations/2153_admin_venues_hardening.sql:41`.
- Reminder (defense-in-depth): if `public.venue_stats` is a **view** or **materialized view** that is exposed via the Data API, it may **bypass underlying table RLS** by default depending on owner/privileges. During the sweep, confirm its `relkind`, owner, and `reloptions` (and use `security_invoker = true` where applicable) so RLS is enforced as intended. `supabase/migrations/2153_admin_venues_hardening.sql:81`.

## Abuse & validation controls

- Pagination bounds: RPC clamps `p_limit` and `p_offset` using `LEAST`/`GREATEST`. `supabase/migrations/2153_admin_venues_hardening.sql:84`.
- Client search is debounced (250ms) and stored in `?q=` for repeatable queries. `src/pages/AdminVenuesList.tsx:118`.

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
