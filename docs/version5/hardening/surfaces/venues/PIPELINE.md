# Venues Pipeline (E2E)
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
- Route: `/venues` (public). `src/App.tsx:221-222`.
- Page: `src/pages/VenuesIndex.tsx` (VenuesIndex component).
- Auth gate: none for this route (no `RequireAuth`), but `DeletedAccountGate` runs inside layout for signed-in users. `src/components/Layout.tsx:9-16`, `src/components/DeletedAccountGate.tsx:49-67`.
- Related surfaces / handoffs: `/venues/:slug` (venue detail). `src/pages/VenuesIndex.tsx:464-466`.

## Surface narrative (step-by-step)
1) Route + access gate
   - The route is public; no `RequireAuth` wrapper. `src/App.tsx:221-222`.
   - `DeletedAccountGate` checks `profiles.is_deleted` and signs out + redirects to `/account-deleted` if true. `src/components/DeletedAccountGate.tsx:49-67`.

2) Initial load + search
   - The page reads `q` from search params and keeps local state. `src/pages/VenuesIndex.tsx:65-68`.
   - A 300ms debounce updates `q` and calls `loadVenues(0)`. `src/pages/VenuesIndex.tsx:111-124`.
   - `loadVenues` calls `get_venues` with `p_search`, `p_limit=20`, `p_offset`, then updates list, offset, and `hasMore`. `src/pages/VenuesIndex.tsx:82-105`.
   - On RPC error, it logs and clears results (or retains previous on append), and disables pagination. `src/pages/VenuesIndex.tsx:96-100`.

3) Thumbnails (N+1 RPCs)
   - For each venue, it requests a thumbnail with `get_venue_photos` (limit 1). `src/pages/VenuesIndex.tsx:138-142`.
   - If no photo is found, it falls back to `get_venue_recent_catches` (limit 1) and extracts `image_url`. `src/pages/VenuesIndex.tsx:153-157`, `src/pages/VenuesIndex.tsx:159-175`.
   - Storage paths are converted to public URLs using `getPublicAssetUrl`. `src/pages/VenuesIndex.tsx:146-148`, `src/pages/VenuesIndex.tsx:165-169`, `src/lib/storage.ts:7-13`.
   - A TODO notes this is N+1 RPCs (potential batching later). `src/pages/VenuesIndex.tsx:181-182`.

4) Filters, sort, and pagination
   - Client-side filters: ticket type and "carp-friendly only" (facility tag match). `src/pages/VenuesIndex.tsx:233-248`.
   - Client-side sorting: name, most catches, most active (30d), highest rated. `src/pages/VenuesIndex.tsx:253-279`.
   - "Load more venues" uses `offset` pagination via `get_venues`. `src/pages/VenuesIndex.tsx:194-197`, `src/pages/VenuesIndex.tsx:476-492`.

5) UI states
   - Loading: `PageSpinner` with "Loading venues...". `src/pages/VenuesIndex.tsx:347-350`.
   - Empty search state: "No venues match your search". `src/pages/VenuesIndex.tsx:351-357`.
   - Empty filters state: "No venues match these filters". `src/pages/VenuesIndex.tsx:358-365`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| get_venues | `p_search`, `p_limit`, `p_offset` | `src/pages/VenuesIndex.tsx:90-94` | SECURITY INVOKER; joins `venue_stats_public` view. `supabase/migrations/2153_admin_venues_hardening.sql:240-300`. |
| get_venue_photos | `p_venue_id`, `p_limit`, `p_offset` | `src/pages/VenuesIndex.tsx:138-142` | SECURITY INVOKER. `supabase/migrations/2125_venue_photos_primary.sql:93-109`. Grant to anon/auth in `supabase/migrations/2078_venue_photos_and_rpcs.sql:118-120` (verify after replacement). |
| get_venue_recent_catches | `p_venue_id`, `p_limit`, `p_offset` | `src/pages/VenuesIndex.tsx:153-157` | SECURITY INVOKER; explicit `visibility = 'public'` filter. `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql:7-95`. EXECUTE grant is authenticated-only. `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql:185`. |

### PostgREST
- None observed.

### Storage
- No storage API calls; public URLs are built from storage paths. `src/pages/VenuesIndex.tsx:146-148`, `src/lib/storage.ts:7-13`.

### Realtime
- None.

### Third-party APIs
- None.

## Implicit DB side-effects
- None (read-only surface).

## Security posture notes (facts only)
- `/venues` is public (no `RequireAuth`), so access is controlled by RPC logic, grants, and RLS. `src/App.tsx:221-222`.
- `get_venues` is SECURITY INVOKER and joins `venue_stats_public` (view filtered to published venues). `supabase/migrations/2153_admin_venues_hardening.sql:228-233`, `supabase/migrations/2153_admin_venues_hardening.sql:240-296`.
- `get_venue_recent_catches` enforces `visibility = 'public'` in the RPC itself. `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql:89-91`.
- Thumbnail RPCs are best-effort; failures result in "no image" UI and do not block the page. `src/pages/VenuesIndex.tsx:144-150`, `src/pages/VenuesIndex.tsx:153-176`.

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'venues',
    'venue_stats',
    'venue_stats_public',
    'venue_photos',
    'catches',
    'profiles',
    'ratings',
    'catch_comments',
    'catch_reactions'
  );

-- RLS policies for touched tables/views
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'venues',
    'venue_stats',
    'venue_photos',
    'catches',
    'profiles',
    'ratings',
    'catch_comments',
    'catch_reactions'
  );

-- View posture (venue_stats_public)
select
  c.relname,
  c.relkind,
  c.relowner::regrole as owner,
  c.relrowsecurity,
  c.relforcerowsecurity,
  c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('venue_stats_public');

-- RPC posture
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('get_venues', 'get_venue_photos', 'get_venue_recent_catches');

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('get_venues', 'get_venue_photos', 'get_venue_recent_catches');

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in ('get_venues', 'get_venue_photos', 'get_venue_recent_catches');

-- Storage policies (venue-photos bucket)
select
  pol.polname as policyname,
  pol.polcmd,
  pol.polroles::regrole[] as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as qual,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects'
order by pol.polname;

select *
from storage.objects
where bucket_id = 'venue-photos'
limit 5;
```

## Open verification items
- Confirm RLS on `venues` prevents unpublished venues from being listed to anon, since `get_venues` does not filter `is_published` directly.
- Verify whether anon can execute `get_venue_recent_catches` (current grant in `2127` is authenticated-only).
- Confirm `get_venue_photos` EXECUTE grants remain for anon/auth after the function replacement in `2125`.
- Validate `venue_stats_public` view security posture (owner/security_invoker) does not bypass underlying RLS.
- Confirm storage policies for `venue-photos` enforce public-only exposure of allowed objects.

## Repro commands used
```
cat docs/version5/hardening/surfaces/venues/PIPELINE.md
nl -ba src/App.tsx | sed -n '216,230p'
nl -ba src/pages/VenuesIndex.tsx
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes" src/pages/VenuesIndex.tsx src/pages/venues -S
nl -ba supabase/migrations/2153_admin_venues_hardening.sql | sed -n '236,320p'
nl -ba supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql | sed -n '1,200p'
nl -ba supabase/migrations/2125_venue_photos_primary.sql | sed -n '90,130p'
nl -ba supabase/migrations/2078_venue_photos_and_rpcs.sql | sed -n '110,130p'
rg -n "GRANT EXECUTE ON FUNCTION public.get_venue_photos" supabase/migrations -S
nl -ba src/lib/storage.ts | sed -n '1,40p'
```
