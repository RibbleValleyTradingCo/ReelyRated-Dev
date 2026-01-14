# Admin Venues Pipeline (E2E)
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
- Route: `/admin/venues` (RequireAuth in `src/App.tsx:297`)
- Page: `src/pages/AdminVenuesList.tsx`
- Admin gate: `isAdminUser` in `src/pages/AdminVenuesList.tsx:47` (queries `admin_users` in `src/lib/admin.ts:14`)
- Admin RPC: `public.admin_get_venues` in `supabase/migrations/2153_admin_venues_hardening.sql:12`
- Handoff route: `/admin/venues/:slug` (admin-venue-edit surface) via `src/pages/AdminVenuesList.tsx:251`

## Surface narrative (step-by-step)
1) Route + auth gate
   - `/admin/venues` is wrapped by `RequireAuth` in the router. `src/App.tsx:297`.
   - `RequireAuth` redirects anon users to `/auth` without a toast. `src/App.tsx:67`.

2) Admin check (client)
   - `checkAdmin` runs on mount and calls `isAdminUser(user.id)`. `src/pages/AdminVenuesList.tsx:47`.
   - If the user is not admin, it toasts "You must be an admin to view this page.", navigates to `/`, and sets `adminStatus` to `unauthorized`. `src/pages/AdminVenuesList.tsx:55`.

3) Checking + unauthorized UI
   - While `adminStatus === "checking"`, the page shows a spinner and "Checking admin access...". `src/pages/AdminVenuesList.tsx:142`.
   - When `adminStatus === "unauthorized"`, it renders an "Access denied" card with a "Back to home" link. `src/pages/AdminVenuesList.tsx:153`.

4) Initial state + search setup
   - Search state initializes from the `?q=` query param. `src/pages/AdminVenuesList.tsx:33`.
   - A 250ms debounce updates `?q=`, sets `activeQuery`, and triggers `loadVenues`. `src/pages/AdminVenuesList.tsx:118`.

5) Data load
   - `loadVenues` calls `supabase.rpc('admin_get_venues')` with `p_search`, `p_limit=20`, and `p_offset`. `src/pages/AdminVenuesList.tsx:80`.
   - Results update `venues`, `hasMore`, and `offset` for pagination. `src/pages/AdminVenuesList.tsx:106`.

6) Error handling
   - If the RPC error indicates unauthorized (`42501`/`28000` or message includes "admin"), it shows the admin toast, sets `adminStatus` to `unauthorized`, and navigates to `/`. `src/pages/AdminVenuesList.tsx:90`.
   - Other failures toast "Failed to load venues". `src/pages/AdminVenuesList.tsx:104`.

7) Pagination
   - "Load more venues" calls `loadVenues(offset, true, activeQuery)` when `hasMore` is true. `src/pages/AdminVenuesList.tsx:136`.

8) Navigation actions
   - Each row links to `/admin/venues/:slug` for edit (handoff to admin-venue-edit surface). `src/pages/AdminVenuesList.tsx:251`.
   - Each row links to `/venues/:slug` for the public venue page. `src/pages/AdminVenuesList.tsx:267`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| admin_get_venues | p_search, p_limit, p_offset | `src/pages/AdminVenuesList.tsx:80` | SECURITY INVOKER + admin check. Joins `public.venues` + `public.venue_stats`, orders by name, bounds limit/offset. `supabase/migrations/2153_admin_venues_hardening.sql:12`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| admin_users | select | `src/lib/admin.ts:14` | Admin gate via `isAdminUser`. RLS: `admin_users_self_select`. `supabase/migrations/2016_phase1_admin_visibility.sql:20`. |

### Storage
- None found.

### Realtime
- None found.

### Third-party APIs
- None.

## Implicit DB side-effects
- Read-only: the surface performs no inserts/updates/deletes. `admin_get_venues` returns data only.

## Security posture notes (facts only)
- Access enforcement: `RequireAuth` (router) + client admin check (`isAdminUser`) + server-side admin check inside `admin_get_venues`. `src/App.tsx:297`, `src/pages/AdminVenuesList.tsx:55`, `supabase/migrations/2153_admin_venues_hardening.sql:48`.
- `admin_get_venues` is `SECURITY INVOKER` with `SET search_path = public, extensions` and uses `public.is_admin` for gating. `supabase/migrations/2153_admin_venues_hardening.sql:41`.
- RLS: `venues_select_admin_all` policy exists to allow admin reads on `public.venues`. `supabase/migrations/2086_venues_rls.sql:71`.
- View usage: `admin_get_venues` joins `public.venue_stats`; confirm view posture/privileges during sweep. `supabase/migrations/2153_admin_venues_hardening.sql:81`.

## SQL queries to run during sweep
```
-- Grants (tables/views involved)
select *
from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('admin_users', 'venues', 'venue_stats');

-- RLS policies
select *
from pg_policies
where schemaname='public'
  and tablename in ('admin_users', 'venues');

-- RPC definition + grants + posture
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and proname='admin_get_venues';

select *
from information_schema.routine_privileges
where routine_schema='public' and routine_name='admin_get_venues';

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid=pronamespace
where n.nspname='public' and proname='admin_get_venues';
```

## Repro commands used
```
rg -n "AdminVenues|AdminVenuesList|admin-venues|/admin/venues" src -S
rg -n "useAdminAuth|RequireAuth|isAdminUser|admin_users" src -S
rg -n "admin_get_venues" src supabase -S
rg -n "supabase\.rpc\(" src -S
rg -n "supabase\.from\(" src -S
rg -n "storage\.from\(" src -S
rg -n "channel\(|realtime|postgres_changes" src -S
```
