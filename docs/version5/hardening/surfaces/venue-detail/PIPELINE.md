# Venue Detail Pipeline (E2E)
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
- Route: `/venues/:slug` (public). `src/App.tsx:221-222`.
- Page: `src/pages/VenueDetail.tsx` (VenueDetail component).
- Data hook: `useVenueDetailData` in `src/pages/venue-detail/hooks/useVenueDetailData.ts`.
- Auth gate: none for this route (no `RequireAuth`), but `DeletedAccountGate` runs inside layout for signed-in users. `src/components/Layout.tsx:9-16`, `src/components/DeletedAccountGate.tsx:49-67`.
- Related surfaces / handoffs: `/venues` (not found CTA), `/catch/:id`, `/add-catch?venue=<slug>`, `/feed?venue=<slug>`. `src/pages/VenueDetail.tsx:317-332`, `src/pages/VenueDetail.tsx:512-518`, `src/pages/venue-detail/components/RecentCatchesSection.tsx:83-85`, `src/pages/venue-detail/components/RecentCatchesSection.tsx:69-71`, `src/pages/venue-detail/components/RecentCatchesSection.tsx:148-149`.

## Surface narrative (step-by-step)
1) Route + access gate
   - The route is public; no `RequireAuth` wrapper. `src/App.tsx:221-222`.
   - `DeletedAccountGate` checks `profiles.is_deleted` and signs out + redirects to `/account-deleted` if true. `src/components/DeletedAccountGate.tsx:49-67`.

2) Initial load
   - `VenueDetail` reads `slug` and calls `useVenueDetailData`. `src/pages/VenueDetail.tsx:26-65`.
   - `useVenueDetailData` calls `get_venue_by_slug` and returns the first row. `src/pages/venue-detail/hooks/useVenueDetailData.ts:93-100`.
   - While loading, the page shows a spinner. `src/pages/VenueDetail.tsx:307-314`.
   - If no venue is returned, the page renders "Venue not found" with a back link to `/venues`. `src/pages/VenueDetail.tsx:317-332`.

3) Data reads (parallel queries)
   - Venue rating for the current user: `get_my_venue_rating` (auth only). `src/pages/venue-detail/hooks/useVenueDetailData.ts:131-142`.
   - Venue stats and content via PostgREST: opening hours, pricing tiers, rules, species stock. `src/pages/venue-detail/hooks/useVenueDetailData.ts:154-238`.
   - Venue events via RPC: upcoming and past events (paged). `src/pages/venue-detail/hooks/useVenueDetailData.ts:245-399`.
   - Venue photos via RPC. `src/pages/venue-detail/hooks/useVenueDetailData.ts:264-279`.
   - Top catches and recent catches via RPCs (recent uses pagination). `src/pages/venue-detail/hooks/useVenueDetailData.ts:303-374`.
   - Ownership/admin checks: `admin_users` and `venue_owners` for UI flags. `src/pages/venue-detail/hooks/useVenueDetailData.ts:434-470`.

4) User actions / flows
   - Ratings: opening the rating modal requires a logged-in user; submitting uses `upsert_venue_rating` with optimistic UI updates and rollback on failure. `src/pages/VenueDetail.tsx:230-235`, `src/pages/venue-detail/hooks/useVenueDetailData.ts:500-553`.
   - Past events toggle + pagination: toggles show/hide and loads more past events via RPC. `src/pages/VenueDetail.tsx:299-305`, `src/pages/venue-detail/hooks/useVenueDetailData.ts:382-415`.
   - Recent catches "View all" link to `/feed?venue=<slug>` and "Log catch" link to `/add-catch?venue=<slug>`. `src/pages/venue-detail/components/RecentCatchesSection.tsx:69-71`, `src/pages/venue-detail/components/RecentCatchesSection.tsx:148-149`.

5) UI states
   - Venue not found state: "This venue doesn't exist or isn't published." `src/pages/VenueDetail.tsx:326-328`.
   - Loading states for events, photos, and ratings are handled in their sections and passed down as props. `src/pages/venue-detail/hooks/useVenueDetailData.ts:289-297`, `src/pages/venue-detail/hooks/useVenueDetailData.ts:290-292`, `src/pages/VenueDetail.tsx:452-458`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args | File | Notes |
| --- | --- | --- | --- |
| get_venue_by_slug | `p_slug` | `src/pages/venue-detail/hooks/useVenueDetailData.ts:93-95` | SECURITY INVOKER; joins `venue_stats_public` view. `supabase/migrations/2153_admin_venues_hardening.sql:312-383`. |
| get_my_venue_rating | `p_venue_id` | `src/pages/venue-detail/hooks/useVenueDetailData.ts:131-133` | SECURITY INVOKER, returns only current user's rating. `supabase/migrations/2079_create_venue_ratings.sql:109-128`. |
| get_venue_upcoming_events | `p_venue_id` | `src/pages/venue-detail/hooks/useVenueDetailData.ts:250-252` | SECURITY INVOKER; `is_published = true` filter. `supabase/migrations/2090_venue_events_rpcs.sql:66-110`. |
| get_venue_past_events | `p_venue_id`, `p_limit`, `p_offset` | `src/pages/venue-detail/hooks/useVenueDetailData.ts:389-393` | SECURITY INVOKER; `is_published = true` filter. `supabase/migrations/2090_venue_events_rpcs.sql:116-162`. |
| get_venue_photos | `p_venue_id`, `p_limit`, `p_offset` | `src/pages/venue-detail/hooks/useVenueDetailData.ts:269-273` | SECURITY INVOKER; returns `venue_photos`. `supabase/migrations/2125_venue_photos_primary.sql:93-109`. |
| get_venue_top_catches | `p_venue_id`, `p_limit` | `src/pages/venue-detail/hooks/useVenueDetailData.ts:308-311` | SECURITY INVOKER; explicit `visibility = 'public'` filter. `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql:99-182`. |
| get_venue_recent_catches | `p_venue_id`, `p_limit`, `p_offset` | `src/pages/venue-detail/hooks/useVenueDetailData.ts:353-357` | SECURITY INVOKER; explicit `visibility = 'public'` filter. `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql:7-95`. |
| upsert_venue_rating | `p_venue_id`, `p_rating` | `src/pages/venue-detail/hooks/useVenueDetailData.ts:522-525` | SECURITY DEFINER; validates rating 1-5. `supabase/migrations/2083_fix_upsert_venue_rating_ambiguity_v2.sql:4-58`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| venue_opening_hours | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:154-158` | Ordered by `order_index`. |
| venue_pricing_tiers | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:178-182` | Ordered by `order_index`. |
| venue_rules | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:202-206` | `rules_text` by venue. |
| venue_species_stock | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:226-230` | Ordered by `created_at`. |
| venue_owners | select | `src/pages/venue-detail/hooks/useVenueDetailData.ts:465-470` | Ownership check for current user. |
| admin_users | select | `src/lib/admin.ts:14-18` | Admin check for UI flags (not a security boundary). |
| profiles | select `is_deleted` | `src/components/DeletedAccountGate.tsx:49-53` | Global gate applied in layout. |

### Storage
- No storage API calls. Venue photos and avatars are rendered via public URLs constructed from storage paths. `src/pages/venue-detail/viewModel.ts:136-138`, `src/lib/storage.ts:7-13`.

### Realtime
- None.

### Third-party APIs / external destinations
- Google Maps search + embed URLs are generated client-side and used in links/iframe. `src/pages/venue-detail/viewModel.ts:226-233`, `src/pages/venue-detail/components/LocationMapSection.tsx:47-55`.
- External booking/website links are rendered from venue/event data via `externalLinkProps`. `src/pages/venue-detail/components/VenueHero.tsx:73-76`, `src/pages/venue-detail/components/EventsSection.tsx:22-24`, `src/pages/venue-detail/components/PlanYourVisitSection.tsx:423-425`.

## Implicit DB side-effects
- `upsert_venue_rating` inserts or updates `venue_ratings`. `supabase/migrations/2083_fix_upsert_venue_rating_ambiguity_v2.sql:30-34`.
- Other RPCs and PostgREST calls are read-only in this surface.

## Security posture notes (facts only)
- `/venues/:slug` is public (no `RequireAuth`), so all data access relies on RPC logic, grants, and RLS. `src/App.tsx:221-222`.
- `get_venue_by_slug` is SECURITY INVOKER and joins `venue_stats_public` (a view filtered to published venues). `supabase/migrations/2153_admin_venues_hardening.sql:228-233`, `supabase/migrations/2153_admin_venues_hardening.sql:312-383`.
- `get_venue_recent_catches` / `get_venue_top_catches` are SECURITY INVOKER and explicitly filter `visibility = 'public'`. `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql:89-92`, `supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql:176-179`.
- `get_venue_upcoming_events` / `get_venue_past_events` are SECURITY INVOKER and filter `is_published = true`. `supabase/migrations/2090_venue_events_rpcs.sql:104-107`, `supabase/migrations/2090_venue_events_rpcs.sql:155-158`.
- `get_my_venue_rating` requires authentication (returns nothing when `auth.uid()` is null). `supabase/migrations/2079_create_venue_ratings.sql:118-127`.
- `upsert_venue_rating` is SECURITY DEFINER and enforces rating bounds (1-5). `supabase/migrations/2083_fix_upsert_venue_rating_ambiguity_v2.sql:15-28`.
- Ownership/admin checks in the UI (`venue_owners`, `admin_users`) are UX-only; server-side enforcement must be in RPCs/RLS. `src/pages/venue-detail/hooks/useVenueDetailData.ts:434-470`, `src/lib/admin.ts:10-18`.

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
    'venue_opening_hours',
    'venue_pricing_tiers',
    'venue_rules',
    'venue_species_stock',
    'venue_photos',
    'venue_events',
    'venue_owners',
    'venue_ratings',
    'catches',
    'profiles',
    'ratings',
    'catch_comments',
    'catch_reactions',
    'admin_users'
  );

-- RLS policies for touched tables
select *
from pg_policies
where schemaname = 'public'
  and tablename in (
    'venues',
    'venue_stats',
    'venue_opening_hours',
    'venue_pricing_tiers',
    'venue_rules',
    'venue_species_stock',
    'venue_photos',
    'venue_events',
    'venue_owners',
    'venue_ratings',
    'catches',
    'profiles',
    'ratings',
    'catch_comments',
    'catch_reactions',
    'admin_users'
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
  and proname in (
    'get_venue_by_slug',
    'get_my_venue_rating',
    'get_venue_upcoming_events',
    'get_venue_past_events',
    'get_venue_photos',
    'get_venue_top_catches',
    'get_venue_recent_catches',
    'upsert_venue_rating'
  );

select *
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'get_venue_by_slug',
    'get_my_venue_rating',
    'get_venue_upcoming_events',
    'get_venue_past_events',
    'get_venue_photos',
    'get_venue_top_catches',
    'get_venue_recent_catches',
    'upsert_venue_rating'
  );

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in (
    'get_venue_by_slug',
    'get_my_venue_rating',
    'get_venue_upcoming_events',
    'get_venue_past_events',
    'get_venue_photos',
    'get_venue_top_catches',
    'get_venue_recent_catches',
    'upsert_venue_rating'
  );

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
- Confirm RLS on `venues` and `venue_stats_public` ensures unpublished venues are not exposed.
- Validate anon access for `get_venue_top_catches` and `get_venue_recent_catches` (current migrations grant EXECUTE to authenticated only).
- Confirm `venue_photos` RLS and storage policies restrict access to published/public photos only.
- Verify rating updates (`upsert_venue_rating`) correctly update any aggregate stats (if triggers exist).

## Repro commands used
```
cat docs/version5/hardening/surfaces/venue-detail/PIPELINE.md
nl -ba src/App.tsx | sed -n '210,240p'
nl -ba src/pages/VenueDetail.tsx
nl -ba src/pages/venue-detail/hooks/useVenueDetailData.ts
nl -ba src/pages/venue-detail/viewModel.ts
nl -ba src/pages/venue-detail/components/RecentCatchesSection.tsx
nl -ba src/pages/venue-detail/components/LocationMapSection.tsx
rg -n "externalLinkProps" src/pages/venue-detail -S
rg -n "supabase\\.rpc\\(|supabase\\.from\\(|storage\\.from\\(|channel\\(|postgres_changes" src/pages/venue-detail -S
rg -n "get_venue_by_slug|get_my_venue_rating|get_venue_upcoming_events|get_venue_photos|get_venue_top_catches|get_venue_recent_catches|get_venue_past_events|upsert_venue_rating" supabase/migrations -S
rg -n "GRANT EXECUTE ON FUNCTION public.get_venue_recent_catches|GRANT EXECUTE ON FUNCTION public.get_venue_top_catches" supabase/migrations -S
rg -n "venue_stats_public" supabase/migrations -S
nl -ba supabase/migrations/2153_admin_venues_hardening.sql | sed -n '210,420p'
nl -ba supabase/migrations/2127_harden_venue_catch_rpcs_public_only.sql | sed -n '1,220p'
nl -ba supabase/migrations/2090_venue_events_rpcs.sql | sed -n '60,190p'
nl -ba supabase/migrations/2079_create_venue_ratings.sql | sed -n '60,160p'
nl -ba supabase/migrations/2083_fix_upsert_venue_rating_ambiguity_v2.sql | sed -n '1,90p'
nl -ba supabase/migrations/2125_venue_photos_primary.sql | sed -n '70,140p'
nl -ba supabase/migrations/2078_venue_photos_and_rpcs.sql | sed -n '80,140p'
```
