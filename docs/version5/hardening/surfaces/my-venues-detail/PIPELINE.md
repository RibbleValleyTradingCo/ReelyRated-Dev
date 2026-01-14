# My Venues Detail Pipeline (E2E)
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

## Evidence checklist (kick-off)
- HAR (4 personas):
  - `docs/version5/hardening/surfaces/my-venues-detail/evidence/har/HAR_my-venues-detail_anon_redirect_YYYY-MM-DD.har`
  - `docs/version5/hardening/surfaces/my-venues-detail/evidence/har/HAR_my-venues-detail_auth_nonowner_deny_YYYY-MM-DD.har`
  - `docs/version5/hardening/surfaces/my-venues-detail/evidence/har/HAR_my-venues-detail_owner_allow_YYYY-MM-DD.har`
  - `docs/version5/hardening/surfaces/my-venues-detail/evidence/har/HAR_my-venues-detail_admin_allow_YYYY-MM-DD.har`
- Screenshots:
  - `docs/version5/hardening/surfaces/my-venues-detail/evidence/screenshots/IMG_my-venues-detail_anon_deny_YYYY-MM-DD.png`
  - `docs/version5/hardening/surfaces/my-venues-detail/evidence/screenshots/IMG_my-venues-detail_auth_nonowner_deny_YYYY-MM-DD.png`
  - `docs/version5/hardening/surfaces/my-venues-detail/evidence/screenshots/IMG_my-venues-detail_owner_allow_YYYY-MM-DD.png`
  - `docs/version5/hardening/surfaces/my-venues-detail/evidence/screenshots/IMG_my-venues-detail_admin_allow_YYYY-MM-DD.png`
- SQL (from probe pack):
  - `docs/version5/hardening/surfaces/my-venues-detail/MY-VENUES-DETAIL-PROBES.sql` (sections A–F)
  - Save outputs under `docs/version5/hardening/surfaces/my-venues-detail/evidence/sql/`:
    - `SQL_my-venues-detail_grants_YYYY-MM-DD.txt`
    - `SQL_my-venues-detail_rls_policies_YYYY-MM-DD.txt`
    - `SQL_my-venues-detail_rpc_posture_YYYY-MM-DD.txt`
    - `SQL_my-venues-detail_routine_privileges_YYYY-MM-DD.txt`
    - `SQL_my-venues-detail_storage_policies_YYYY-MM-DD.txt`
    - `SQL_my-venues-detail_storage_objects_YYYY-MM-DD.txt`
- Discovery required:
  - Run the discovery commands in `docs/version5/hardening/surfaces/my-venues-detail/MY-VENUES-DETAIL-PROBES.sql` and replace `<DYNAMIC_RPC_LIST>` before final posture conclusions.


## Scope
- Route: `/my/venues/:slug` (RequireAuth, under `Layout`). `src/App.tsx:336`, `src/App.tsx:337`, `src/App.tsx:339`.
- Page: `src/pages/MyVenueEdit.tsx`.
- Auth gate: `RequireAuth` plus local redirect if `!user` once auth loading completes. `src/App.tsx:337`, `src/pages/MyVenueEdit.tsx:390`, `src/pages/MyVenueEdit.tsx:392`.
- Admin gate: none; owner/admin checks are enforced in RPCs and by `isOwner` gating in the UI. `src/pages/MyVenueEdit.tsx:411`, `src/pages/MyVenueEdit.tsx:850`.
- Related surfaces: `/my/venues` (back link), `/venues/:slug` (public view). `src/pages/MyVenueEdit.tsx:898`, `src/pages/MyVenueEdit.tsx:901`.

## Surface narrative (step-by-step)
1) Route + access gate
   - `/my/venues/:slug` is wrapped by `RequireAuth`. `src/App.tsx:337`, `src/App.tsx:339`.
   - The page also redirects to `/auth` if auth loading completes and `user` is missing. `src/pages/MyVenueEdit.tsx:390`, `src/pages/MyVenueEdit.tsx:392`.

2) Initial load (venue details)
   - On mount (and when `slug` changes), `owner_get_venue_by_slug` fetches venue details via RPC. `src/pages/MyVenueEdit.tsx:396`, `src/pages/MyVenueEdit.tsx:400`.
   - If the RPC fails, a toast is shown and the page stops loading. `src/pages/MyVenueEdit.tsx:401`, `src/pages/MyVenueEdit.tsx:403`, `src/pages/MyVenueEdit.tsx:406`.
   - `isOwner` is set based on whether a venue row is returned; if not owner, the page renders an "Access denied" card. `src/pages/MyVenueEdit.tsx:409`, `src/pages/MyVenueEdit.tsx:411`, `src/pages/MyVenueEdit.tsx:850`, `src/pages/MyVenueEdit.tsx:857`.

3) Events load (lazy on section open)
   - Events are fetched via `owner_get_venue_events` only when the Events section is opened and the viewer is owner. `src/pages/MyVenueEdit.tsx:483`, `src/pages/MyVenueEdit.tsx:492`, `src/pages/MyVenueEdit.tsx:495`.
   - Errors show a toast and clear the list; success populates `events`. `src/pages/MyVenueEdit.tsx:496`, `src/pages/MyVenueEdit.tsx:498`, `src/pages/MyVenueEdit.tsx:501`.

4) Metadata updates (save)
   - Saving metadata calls `owner_update_venue_metadata` with the editable fields. `src/pages/MyVenueEdit.tsx:623`, `src/pages/MyVenueEdit.tsx:631`.
   - On success, the page refreshes with `owner_get_venue_by_slug` to hydrate the updated row. `src/pages/MyVenueEdit.tsx:641`, `src/pages/MyVenueEdit.tsx:643`.

5) Event create/update/delete flows
   - Update event uses `owner_update_venue_event`. `src/pages/MyVenueEdit.tsx:734`, `src/pages/MyVenueEdit.tsx:739`.
   - Create event uses `owner_create_venue_event`. `src/pages/MyVenueEdit.tsx:758`.
   - Delete event uses `owner_delete_venue_event`. `src/pages/MyVenueEdit.tsx:793`, `src/pages/MyVenueEdit.tsx:797`.
   - After create/update/delete, events are refreshed via `owner_get_venue_events`. `src/pages/MyVenueEdit.tsx:777`, `src/pages/MyVenueEdit.tsx:804`.

6) Loading and deny UX
   - While loading, the page shows a spinner with "Loading venue...". `src/pages/MyVenueEdit.tsx:833`, `src/pages/MyVenueEdit.tsx:839`.
   - Non-owner access shows an "Access denied" card with a back link. `src/pages/MyVenueEdit.tsx:850`, `src/pages/MyVenueEdit.tsx:857`, `src/pages/MyVenueEdit.tsx:865`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| owner_get_venue_by_slug | p_slug | `src/pages/MyVenueEdit.tsx:400` | SECURITY DEFINER, `search_path=''`, owner/admin gated in SQL. `supabase/migrations/2152_owner_get_venue_by_slug.sql:6`, `supabase/migrations/2152_owner_get_venue_by_slug.sql:41`, `supabase/migrations/2152_owner_get_venue_by_slug.sql:79`. |
| owner_get_venue_events | p_venue_id | `src/pages/MyVenueEdit.tsx:495` | SECURITY DEFINER; checks `is_venue_admin_or_owner`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:184`, `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:193`. |
| owner_update_venue_metadata | p_venue_id + metadata fields | `src/pages/MyVenueEdit.tsx:631` | SECURITY DEFINER; checks `is_venue_admin_or_owner`, updates `venues`. `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:30`, `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:53`. |
| owner_update_venue_event | p_event_id + fields | `src/pages/MyVenueEdit.tsx:739` | SECURITY DEFINER; validates event owner and updates `venue_events`. `supabase/migrations/2133_fix_owner_event_contact_phone.sql:71`, `supabase/migrations/2133_fix_owner_event_contact_phone.sql:94`. |
| owner_create_venue_event | p_venue_id + fields | `src/pages/MyVenueEdit.tsx:758` | SECURITY DEFINER; checks `is_venue_admin_or_owner`, inserts `venue_events`. `supabase/migrations/2133_fix_owner_event_contact_phone.sql:6`, `supabase/migrations/2133_fix_owner_event_contact_phone.sql:28`. |
| owner_delete_venue_event | p_event_id | `src/pages/MyVenueEdit.tsx:797` | SECURITY DEFINER; checks `is_venue_admin_or_owner`, deletes `venue_events`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:331`, `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:348`. |

### PostgREST
- None found (reads/writes are via RPCs only in this page).

### Storage
- UNKNOWN. `VenuePhotosCard` is used but its storage usage is not verified in this pass. `src/pages/MyVenueEdit.tsx:39`. How to verify: inspect `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx` for `storage.from(...)` calls.

### Realtime
- None found.

### Third-party APIs
- None found.

## Implicit DB side-effects
- Writes occur via RPCs and update `venues` and `venue_events`. No direct client writes.

## Security posture notes (facts only)
- `/my/venues/:slug` is authenticated in the router and does a local redirect for unauthenticated users. `src/App.tsx:337`, `src/pages/MyVenueEdit.tsx:390`.
- `owner_get_venue_by_slug` is SECURITY DEFINER with `search_path=''` and checks admin/owner membership in SQL. `supabase/migrations/2152_owner_get_venue_by_slug.sql:41`, `supabase/migrations/2152_owner_get_venue_by_slug.sql:79`.
- Owner event RPCs and metadata updates use `is_venue_admin_or_owner` checks; authorization is server-side. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:193`, `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:53`.
- UI gating (`isOwner`) is derived from the RPC response and should be treated as UX only. `src/pages/MyVenueEdit.tsx:411`.

## SQL queries to run during sweep
```
-- Grants for touched tables/views
select *
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'venues',
    'venue_stats',
    'venue_events',
    'venue_owners',
    'admin_users'
  );

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'venues',
    'venue_events',
    'venue_owners',
    'admin_users'
  );

-- RPC posture (owner/admin RPCs used by this page)
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'owner_get_venue_by_slug',
    'owner_get_venue_events',
    'owner_update_venue_metadata',
    'owner_create_venue_event',
    'owner_update_venue_event',
    'owner_delete_venue_event'
  );

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'owner_get_venue_by_slug',
    'owner_get_venue_events',
    'owner_update_venue_metadata',
    'owner_create_venue_event',
    'owner_update_venue_event',
    'owner_delete_venue_event'
  );

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in (
    'owner_get_venue_by_slug',
    'owner_get_venue_events',
    'owner_update_venue_metadata',
    'owner_create_venue_event',
    'owner_update_venue_event',
    'owner_delete_venue_event'
  );
```

## Open verification items
- Confirm whether `VenuePhotosCard` uses Storage and which bucket/path conventions are used. How to verify: inspect `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx` for storage calls.
- Confirm any additional RPCs or PostgREST writes triggered by shared cards (PricingTiersCard, OpeningHoursCard, SpeciesStockCard, RulesCard). How to verify: inspect those components for `supabase.rpc`/`supabase.from` calls.

## Repro commands used
```
rg -n "MyVenueEdit|my/venues/:slug|/my/venues" src -S
rg -n "<Route|createBrowserRouter|path=" src/App.tsx -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes|realtime" src/pages/MyVenueEdit.tsx -S
rg -n "owner_get_venue_by_slug|owner_get_venue_events|owner_update_venue_metadata|owner_update_venue_event|owner_create_venue_event|owner_delete_venue_event" supabase/migrations -S
```
