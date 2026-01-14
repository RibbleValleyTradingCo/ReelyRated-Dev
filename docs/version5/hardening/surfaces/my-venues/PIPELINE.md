# My Venues Pipeline (E2E)
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
- Route: `/my/venues` (RequireAuth, under `Layout`). `src/App.tsx:328`, `src/App.tsx:329`, `src/App.tsx:332`.
- Page: `src/pages/MyVenues.tsx`.
- Auth gate: `RequireAuth` plus local redirect if `!user` once auth loading completes. `src/App.tsx:329`, `src/pages/MyVenues.tsx:31`, `src/pages/MyVenues.tsx:33`.
- Admin gate: none (owner view only).
- Related surfaces: `/my/venues/:slug` (manage venue), `/venues/:slug` (public venue), `/auth` (redirect). `src/App.tsx:337`, `src/pages/MyVenues.tsx:141`, `src/pages/MyVenues.tsx:144`, `src/pages/MyVenues.tsx:33`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `/my/venues` is wrapped by `RequireAuth`. `src/App.tsx:329`, `src/App.tsx:331`.
   - The page also redirects to `/auth` if auth loading finishes and `user` is missing. `src/pages/MyVenues.tsx:31`, `src/pages/MyVenues.tsx:33`.

2) Initial load (owned venues)
   - On mount (and whenever `user` changes), `loadVenues` fetches from `venue_owners` joined to `venues` and filters by `user_id`. `src/pages/MyVenues.tsx:37`, `src/pages/MyVenues.tsx:41`, `src/pages/MyVenues.tsx:43`, `src/pages/MyVenues.tsx:44`.
   - The query selects `venues:venue_id (id, slug, name, location, short_tagline, price_from)` and maps each row into `OwnedVenue`. `src/pages/MyVenues.tsx:43`, `src/pages/MyVenues.tsx:60`, `src/pages/MyVenues.tsx:61`.

3) Loading, empty, and error UX
   - While auth or venues load, a loading state with spinner is shown. `src/pages/MyVenues.tsx:77`, `src/pages/MyVenues.tsx:82`.
   - If the query fails, an error toast is shown and the list clears. `src/pages/MyVenues.tsx:45`, `src/pages/MyVenues.tsx:47`, `src/pages/MyVenues.tsx:48`.
   - If no venues are returned, a "No venues yet" card is shown. `src/pages/MyVenues.tsx:107`, `src/pages/MyVenues.tsx:115`.

4) Navigation actions
   - Each venue card includes "View" to `/venues/:slug` and "Manage" to `/my/venues/:slug`. `src/pages/MyVenues.tsx:141`, `src/pages/MyVenues.tsx:144`.

## Entrypoints inventory (with file:line)

### RPCs
- None found.

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| venue_owners | select | `src/pages/MyVenues.tsx:42` | Uses foreign-table select to `venues` via `venue_id`; filters by `user_id`. |
| venues | select | `src/pages/MyVenues.tsx:43` | Selected fields: `id, slug, name, location, short_tagline, price_from` via join. |

### Storage
- None found.

### Realtime
- None found.

### Third-party APIs
- None found.

## Implicit DB side-effects
- No writes are issued from this surface. All operations are read-only.

## Security posture notes (facts only)
- `/my/venues` requires auth in the router and performs a local redirect to `/auth` when unauthenticated. `src/App.tsx:329`, `src/pages/MyVenues.tsx:31`.
- `venue_owners` has RLS enabled with admin-all and self-select policies; select is granted to `authenticated`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:15`, `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:23`, `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:33`, `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:40`.
- `venues` RLS permits owners to select their venues; the join relies on this policy. `supabase/migrations/2086_venues_rls.sql:30`, `supabase/migrations/2086_venues_rls.sql:34`.
- Client-side filter is `eq("user_id", user.id)`; RLS is still the security boundary. `src/pages/MyVenues.tsx:44`.

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'venue_owners',
    'venues',
    'admin_users'
  );

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'venue_owners',
    'venues',
    'admin_users'
  );
```

## Open verification items
- Confirm RLS on `venue_owners` and `venues` returns only the current user's owned venues for this join. How to verify: run the policy queries above and test `venue_owners`/`venues` selects as normal vs owner users.
- Confirm `venue_owners` select does not expose fields beyond the join list (only the projected columns from `venues`). How to verify: compare actual REST responses for the query with the select list in `MyVenues.tsx`.

## Repro commands used
```
rg -n "<Route|createBrowserRouter|path=" src/App.tsx -S
rg -n "MyVenues|my venues|/my/venues" src -S
rg -n "\\.from\\(\\\"" src/pages/MyVenues.tsx -S
rg -n "venue_owners" supabase/migrations -S
```
