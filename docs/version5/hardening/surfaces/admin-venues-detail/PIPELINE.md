# Admin Venues Detail Pipeline (E2E)
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
- Route: `/admin/venues/:slug` (RequireAuth in `src/App.tsx:305`).
- Param: `slug` is a venue slug string (`useParams<{ slug: string }>()` in `src/pages/AdminVenueEdit.tsx:143`).
- Page: `src/pages/AdminVenueEdit.tsx`.

### Shared components (coupling note)
- This surface composes shared “owner/admin” UI components from:
  - `src/pages/venue-owner-admin/components/*`
  - `src/pages/my-venues/components/RulesCard.tsx`
- Treat `mode="admin"` and client gates as UX only (not a security boundary). Server-side RPC admin checks + RLS must enforce access.
- During sweep, confirm shared components do not perform any direct PostgREST writes (only reads) and that all writes go through admin RPCs.
- Admin gate: `checkAdmin` in `src/pages/AdminVenueEdit.tsx:437` uses `isAdminUser` (`src/lib/admin.ts:14`) against `admin_users`.
- Admin RPCs used by this surface:
  - `public.admin_get_venue_by_slug` (`supabase/migrations/2132_split_get_venue_by_slug_public_admin.sql:93`).
  - `public.admin_get_venue_events` (`supabase/migrations/2090_venue_events_rpcs.sql:290`).
  - `public.admin_update_venue_metadata` (`supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:87`).
  - `public.admin_add_venue_owner` / `public.admin_remove_venue_owner` (`supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:44`).
  - `public.admin_create_venue_event` / `public.admin_update_venue_event` / `public.admin_delete_venue_event` (`supabase/migrations/2090_venue_events_rpcs.sql:168`).
  - `public.admin_update_venue_booking` (`supabase/migrations/2118_venue_owner_phase1_mvp.sql:322`).
  - `public.admin_update_venue_rules` (`supabase/migrations/2118_venue_owner_phase1_mvp.sql:852`).
  - `public.admin_create_venue_opening_hour` / `public.admin_update_venue_opening_hour` / `public.admin_delete_venue_opening_hour` (`supabase/migrations/2118_venue_owner_phase1_mvp.sql:468`).
  - `public.admin_create_venue_pricing_tier` / `public.admin_update_venue_pricing_tier` (`supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:241`).
  - `public.admin_delete_venue_pricing_tier` (`supabase/migrations/2118_venue_owner_phase1_mvp.sql:785`).
  - `public.admin_create_venue_species_stock` / `public.admin_update_venue_species_stock` / `public.admin_delete_venue_species_stock` (`supabase/migrations/2123_create_venue_species_stock.sql:223`).
  - `public.admin_add_venue_photo` (`supabase/migrations/2130_harden_venue_photo_path_validation.sql:50`).
  - `public.admin_delete_venue_photo` (`supabase/migrations/2129_admin_venue_photo_rpcs.sql:36`).
  - `public.admin_set_venue_photo_primary` (`supabase/migrations/2125_venue_photos_primary.sql:55`).
- Public RPC used by this surface:
  - `public.get_venue_photos` (`supabase/migrations/2125_venue_photos_primary.sql:93`).

## Surface narrative (step-by-step)
1) Route + auth gate
   - `/admin/venues/:slug` is wrapped by `RequireAuth` in the router. `src/App.tsx:305`.
   - `RequireAuth` redirects anon users to `/auth` (no toast). `src/App.tsx:58`.

2) Admin gate (client)
   - `checkAdmin` runs on mount and on auth changes. If no user or not admin it toasts "You must be an admin to view this page." and navigates to `/`. `src/pages/AdminVenueEdit.tsx:437`.
   - The check uses `isAdminUser` which queries `admin_users`. `src/lib/admin.ts:14`.

3) Loading + unauthorized UI
   - While admin status is "checking", the page shows a spinner with "Checking admin access...". `src/pages/AdminVenueEdit.tsx:986`.
   - If `adminStatus` is "unauthorized", the component renders an "Access denied" card and a "Back to home" button. `src/pages/AdminVenueEdit.tsx:997`.

4) Initial venue load
   - After admin is authorized, `admin_get_venue_by_slug` is called with `p_slug`. `src/pages/AdminVenueEdit.tsx:463`.
   - Errors toast "Failed to load venue"; a missing venue renders "Venue not found" and links back to `/admin/venues`. `src/pages/AdminVenueEdit.tsx:465`, `src/pages/AdminVenueEdit.tsx:1032`.

5) Events + owners data load (post-venue)
   - Events load via `admin_get_venue_events` with `p_venue_id`. `src/pages/AdminVenueEdit.tsx:545`.
   - Owners load via PostgREST `venue_owners` with a join to `profiles` for usernames. `src/pages/AdminVenueEdit.tsx:565`.

6) Metadata save flow
   - `admin_update_venue_metadata` runs with `p_venue_id` + metadata fields. `src/pages/AdminVenueEdit.tsx:699`.
   - On success it refreshes the venue via `admin_get_venue_by_slug` and invalidates query caches. `src/pages/AdminVenueEdit.tsx:712`.

7) Owner management
   - Owner lookup uses `profiles` with `.or(id.eq...,username.eq...)` to resolve a user. `src/pages/AdminVenueEdit.tsx:784`.
   - Add owner calls `admin_add_venue_owner`, then refreshes `venue_owners`. `src/pages/AdminVenueEdit.tsx:802`.
   - Remove owner calls `admin_remove_venue_owner`. `src/pages/AdminVenueEdit.tsx:837`.

8) Event management
   - Event form requires title and start date/time. `src/pages/AdminVenueEdit.tsx:878`.
   - Create uses `admin_create_venue_event`; update uses `admin_update_venue_event`; delete uses `admin_delete_venue_event`. `src/pages/AdminVenueEdit.tsx:885`.
   - Refreshes events after create/update/delete via `admin_get_venue_events`. `src/pages/AdminVenueEdit.tsx:924`.

9) Booking toggle
   - BookingCard calls `admin_update_venue_booking` to flip `booking_enabled`. `src/pages/venue-owner-admin/components/BookingCard.tsx:40`.

10) Rules editor
   - RulesCard loads `venue_rules` via PostgREST and writes via `admin_update_venue_rules`. `src/pages/my-venues/components/RulesCard.tsx:49`.

11) Opening hours
   - OpeningHoursCard loads `venue_opening_hours` via PostgREST. `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:183`.
   - Saves via `admin_create_venue_opening_hour` / `admin_update_venue_opening_hour` / `admin_delete_venue_opening_hour`. `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:504`.

12) Pricing tiers
   - PricingTiersCard loads `venue_pricing_tiers` via PostgREST. `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:104`.
   - Saves via `admin_create_venue_pricing_tier` / `admin_update_venue_pricing_tier` / `admin_delete_venue_pricing_tier`. `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:333`.

13) Species stock
   - SpeciesStockCard loads `venue_species_stock` via PostgREST. `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:100`.
   - Saves via `admin_create_venue_species_stock` / `admin_update_venue_species_stock` / `admin_delete_venue_species_stock`. `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:333`.

14) Photos (storage + DB)
   - Photos load via `get_venue_photos` with `p_limit=60`, `p_offset=0`. `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70`.
   - Upload writes to storage bucket `venue-photos` (upsert false), then inserts via `admin_add_venue_photo`. `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:170`.
   - On insert failure, it deletes the uploaded object from storage. `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:198`.
   - Delete removes the storage object then calls `admin_delete_venue_photo`. `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:230`.
   - Set primary calls `admin_set_venue_photo_primary`. `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:265`.

15) Navigation handoffs
   - Links back to `/admin/venues` and public `/venues/:slug`. `src/pages/AdminVenueEdit.tsx:1140`.

## Entrypoints inventory (with file:line)

### RPCs
| RPC | Args (from call sites) | File | Notes |
| --- | --- | --- | --- |
| admin_get_venue_by_slug | p_slug | `src/pages/AdminVenueEdit.tsx:463` | SECURITY DEFINER + admin check; joins `venues` + `venue_stats` view; returns `notes_for_rr_team`. `supabase/migrations/2132_split_get_venue_by_slug_public_admin.sql:93`. |
| admin_get_venue_events | p_venue_id | `src/pages/AdminVenueEdit.tsx:545` | SECURITY DEFINER + admin check. `supabase/migrations/2090_venue_events_rpcs.sql:290`. |
| admin_update_venue_metadata | p_venue_id, p_short_tagline, p_description, p_ticket_type, p_price_from, p_best_for_tags, p_facilities, p_website_url, p_booking_url, p_contact_phone, p_notes_for_rr_team, p_payment_methods, p_payment_notes | `src/pages/AdminVenueEdit.tsx:699` | SECURITY DEFINER + admin check; updates `venues` metadata. `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:87`. |
| admin_add_venue_owner | p_venue_id, p_user_id, p_role | `src/pages/AdminVenueEdit.tsx:802` | SECURITY DEFINER + admin check; inserts `venue_owners`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:44`. |
| admin_remove_venue_owner | p_venue_id, p_user_id | `src/pages/AdminVenueEdit.tsx:837` | SECURITY DEFINER + admin check; deletes `venue_owners`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:75`. |
| admin_create_venue_event | p_venue_id, p_title, p_event_type, p_starts_at, p_ends_at, p_description, p_ticket_info, p_website_url, p_booking_url, p_is_published | `src/pages/AdminVenueEdit.tsx:905` | SECURITY DEFINER + admin check; inserts `venue_events`. `supabase/migrations/2090_venue_events_rpcs.sql:168`. |
| admin_update_venue_event | p_event_id, p_venue_id, p_title, p_event_type, p_starts_at, p_ends_at, p_description, p_ticket_info, p_website_url, p_booking_url, p_is_published | `src/pages/AdminVenueEdit.tsx:885` | SECURITY DEFINER + admin check; updates `venue_events`. `supabase/migrations/2090_venue_events_rpcs.sql:213`. |
| admin_delete_venue_event | p_event_id | `src/pages/AdminVenueEdit.tsx:952` | SECURITY DEFINER + admin check; deletes `venue_events`. `supabase/migrations/2090_venue_events_rpcs.sql:263`. |
| admin_update_venue_booking | p_venue_id, p_booking_enabled | `src/pages/venue-owner-admin/components/BookingCard.tsx:40` | SECURITY DEFINER + admin check; updates `venues.booking_enabled`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:322`. |
| admin_update_venue_rules | p_venue_id, p_rules_text | `src/pages/my-venues/components/RulesCard.tsx:93` | SECURITY DEFINER + admin check; upserts `venue_rules`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:852`. |
| admin_create_venue_opening_hour | p_venue_id, p_label, p_day_of_week, p_opens_at, p_closes_at, p_is_closed, p_order_index | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:504` | SECURITY DEFINER + admin check. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:468`. |
| admin_update_venue_opening_hour | p_id, p_venue_id, p_label, p_day_of_week, p_opens_at, p_closes_at, p_is_closed, p_order_index | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:543` | SECURITY DEFINER + admin check. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:518`. |
| admin_delete_venue_opening_hour | p_id | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:475` | SECURITY DEFINER + admin check. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:562`. |
| admin_create_venue_pricing_tier | p_venue_id, p_label, p_price, p_unit, p_audience, p_order_index | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:333` | SECURITY DEFINER + admin check. `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:241`. |
| admin_update_venue_pricing_tier | p_id, p_venue_id, p_label, p_price, p_unit, p_audience, p_order_index | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:352` | SECURITY DEFINER + admin check. `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:288`. |
| admin_delete_venue_pricing_tier | p_id | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:318` | SECURITY DEFINER + admin check. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:785`. |
| admin_create_venue_species_stock | p_venue_id, p_species_name, p_record_weight, p_record_unit, p_avg_weight, p_size_range_min, p_size_range_max, p_stock_density, p_stock_notes | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:333` | SECURITY DEFINER + admin check. `supabase/migrations/2123_create_venue_species_stock.sql:223`. |
| admin_update_venue_species_stock | p_id, p_venue_id, p_species_name, p_record_weight, p_record_unit, p_avg_weight, p_size_range_min, p_size_range_max, p_stock_density, p_stock_notes | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:352` | SECURITY DEFINER + admin check. `supabase/migrations/2123_create_venue_species_stock.sql:279`. |
| admin_delete_venue_species_stock | p_id | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:318` | SECURITY DEFINER + admin check. `supabase/migrations/2123_create_venue_species_stock.sql:327`. |
| get_venue_photos | p_venue_id, p_limit, p_offset | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70` | SECURITY INVOKER; relies on RLS/grants for `venue_photos`. `supabase/migrations/2125_venue_photos_primary.sql:93`. |
| admin_add_venue_photo | p_venue_id, p_image_path, p_caption | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:187` | SECURITY DEFINER + admin check + path prefix validation. `supabase/migrations/2130_harden_venue_photo_path_validation.sql:50`. |
| admin_delete_venue_photo | p_id | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:240` | SECURITY DEFINER + admin check. `supabase/migrations/2129_admin_venue_photo_rpcs.sql:36`. |
| admin_set_venue_photo_primary | p_photo_id | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:265` | SECURITY DEFINER + admin check; updates `venue_photos.is_primary`. `supabase/migrations/2125_venue_photos_primary.sql:55`. |

### PostgREST
| Table | Operations | File | Notes |
| --- | --- | --- | --- |
| admin_users | select | `src/lib/admin.ts:14` | Admin gate query. RLS: `admin_users_self_select`. `supabase/migrations/2016_phase1_admin_visibility.sql:20`. |
| venue_owners | select | `src/pages/AdminVenueEdit.tsx:565` | RLS: `venue_owners_admin_all` / `venue_owners_self_select`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:23`. |
| profiles | select | `src/pages/AdminVenueEdit.tsx:784` | Owner lookup by id/username. RLS: `profiles_select_all`. `supabase/migrations/1004_policies_and_grants.sql:28`. |
| venue_rules | select | `src/pages/my-venues/components/RulesCard.tsx:49` | RLS: `venue_rules_select`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:242`. |
| venue_opening_hours | select | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:183` | RLS: `venue_opening_hours_select`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:68`. |
| venue_pricing_tiers | select | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:104` | RLS: `venue_pricing_tiers_select`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:164`. |
| venue_species_stock | select | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:100` | RLS: `venue_species_stock_select`. `supabase/migrations/2123_create_venue_species_stock.sql:51`. |

PostgREST write posture: UNKNOWN until sweep confirms there are no `.insert/.update/.delete` calls in the shared cards (Rules/OpeningHours/PricingTiers/SpeciesStock) and that writes are RPC-only.

### Storage
| Bucket | Operations | File | Notes |
| --- | --- | --- | --- |
| venue-photos | upload | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:170` | Uploads `venueId/<stamp>.<ext>` with `upsert: false`. |
| venue-photos | remove | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:230` | Deletes by object path prefix; cleanup on failed insert at `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:198`. |

### Realtime
- None found.

### Third-party APIs
- None found.

## Implicit DB side-effects
- `admin_update_venue_metadata` updates `public.venues` and sets `updated_at`. `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:118`.
- `admin_update_venue_booking` updates `public.venues.booking_enabled`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:342`.
- `admin_create/update/delete_venue_event` writes `public.venue_events`. `supabase/migrations/2090_venue_events_rpcs.sql:197`.
- `admin_add/remove_venue_owner` writes `public.venue_owners`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:67`.
- `admin_update_venue_rules` writes `public.venue_rules`, which has `trg_venue_rules_set_updated_at`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:226`.
- `admin_create/update/delete_venue_opening_hour` writes `public.venue_opening_hours`, which has `trg_venue_opening_hours_set_updated_at`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:52`.
- `admin_create/update/delete_venue_pricing_tier` writes `public.venue_pricing_tiers`, which has `trg_venue_pricing_tiers_set_updated_at`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:148`.
- `admin_create/update/delete_venue_species_stock` writes `public.venue_species_stock`, which has `trg_venue_species_stock_set_updated_at`. `supabase/migrations/2123_create_venue_species_stock.sql:35`.
- `admin_add/delete_venue_photo` writes `public.venue_photos` and storage objects under `venue-photos/`. `supabase/migrations/2130_harden_venue_photo_path_validation.sql:88`.

## Abuse controls / bounds
- Event form requires title and start date/time before submit. `src/pages/AdminVenueEdit.tsx:878`.
- Pricing tiers require label + price. `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:145`.
- Species stock requires species name + record weight/unit. `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:145`.
- Photo uploads validate file type + size (10MB max). `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:57`.
- `get_venue_photos` uses `p_limit=60`; the function caps limits to 100. `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70`, `supabase/migrations/2125_venue_photos_primary.sql:107`.

## Security posture notes (facts only)
- Access enforcement combines `RequireAuth` + client admin gate + admin checks inside SECURITY DEFINER RPCs. `src/App.tsx:305`, `src/pages/AdminVenueEdit.tsx:437`.
- `admin_get_venue_by_slug` joins `public.venue_stats` (view). View ownership/security_invoker posture should be verified during sweep. `supabase/migrations/2132_split_get_venue_by_slug_public_admin.sql:177`.
- `get_venue_photos` is SECURITY INVOKER and depends on RLS/grants on `public.venue_photos`. `supabase/migrations/2125_venue_photos_primary.sql:93`.

## SQL queries to run during sweep
```
-- Grants (tables/views involved)
select *
from information_schema.role_table_grants
where table_schema='public'
  and table_name in (
    'admin_users',
    'venues',
    'venue_stats',
    'venue_owners',
    'profiles',
    'venue_events',
    'venue_rules',
    'venue_opening_hours',
    'venue_pricing_tiers',
    'venue_species_stock',
    'venue_photos'
  );

-- RLS policies
select *
from pg_policies
where schemaname='public'
  and tablename in (
    'admin_users',
    'venues',
    'venue_owners',
    'profiles',
    'venue_events',
    'venue_rules',
    'venue_opening_hours',
    'venue_pricing_tiers',
    'venue_species_stock',
    'venue_photos'
  );

-- RPC definitions + grants + posture
select proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'admin_get_venue_by_slug',
    'admin_get_venue_events',
    'admin_update_venue_metadata',
    'admin_add_venue_owner',
    'admin_remove_venue_owner',
    'admin_create_venue_event',
    'admin_update_venue_event',
    'admin_delete_venue_event',
    'admin_update_venue_booking',
    'admin_update_venue_rules',
    'admin_create_venue_opening_hour',
    'admin_update_venue_opening_hour',
    'admin_delete_venue_opening_hour',
    'admin_create_venue_pricing_tier',
    'admin_update_venue_pricing_tier',
    'admin_delete_venue_pricing_tier',
    'admin_create_venue_species_stock',
    'admin_update_venue_species_stock',
    'admin_delete_venue_species_stock',
    'admin_add_venue_photo',
    'admin_delete_venue_photo',
    'admin_set_venue_photo_primary',
    'get_venue_photos'
  );

select *
from information_schema.routine_privileges
where routine_schema='public'
  and routine_name in (
    'admin_get_venue_by_slug',
    'admin_get_venue_events',
    'admin_update_venue_metadata',
    'admin_add_venue_owner',
    'admin_remove_venue_owner',
    'admin_create_venue_event',
    'admin_update_venue_event',
    'admin_delete_venue_event',
    'admin_update_venue_booking',
    'admin_update_venue_rules',
    'admin_create_venue_opening_hour',
    'admin_update_venue_opening_hour',
    'admin_delete_venue_opening_hour',
    'admin_create_venue_pricing_tier',
    'admin_update_venue_pricing_tier',
    'admin_delete_venue_pricing_tier',
    'admin_create_venue_species_stock',
    'admin_update_venue_species_stock',
    'admin_delete_venue_species_stock',
    'admin_add_venue_photo',
    'admin_delete_venue_photo',
    'admin_set_venue_photo_primary',
    'get_venue_photos'
  );

select proname, prosecdef, proconfig
from pg_proc
join pg_namespace n on n.oid=pronamespace
where n.nspname='public'
  and proname in (
    'admin_get_venue_by_slug',
    'admin_get_venue_events',
    'admin_update_venue_metadata',
    'admin_add_venue_owner',
    'admin_remove_venue_owner',
    'admin_create_venue_event',
    'admin_update_venue_event',
    'admin_delete_venue_event',
    'admin_update_venue_booking',
    'admin_update_venue_rules',
    'admin_create_venue_opening_hour',
    'admin_update_venue_opening_hour',
    'admin_delete_venue_opening_hour',
    'admin_create_venue_pricing_tier',
    'admin_update_venue_pricing_tier',
    'admin_delete_venue_pricing_tier',
    'admin_create_venue_species_stock',
    'admin_update_venue_species_stock',
    'admin_delete_venue_species_stock',
    'admin_add_venue_photo',
    'admin_delete_venue_photo',
    'admin_set_venue_photo_primary',
    'get_venue_photos'
  );

-- View posture (venue_stats)
select c.relname, c.relkind, c.relowner::regrole, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('venue_stats', 'venue_stats_public');

-- Storage policies (venue-photos bucket)
-- Note: policy names may not include a consistent prefix, so inspect pg_policy expressions.
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

-- Bucket-specific spot check (recommended)
select *
from storage.objects
where bucket_id = 'venue-photos'
limit 5;
```

## Repro commands used
```
rg -n "AdminVenueEdit|/admin/venues" src/App.tsx
rg -n "admin_get_venue_by_slug|admin_get_venue_events|admin_update_venue_metadata|admin_add_venue_owner|admin_remove_venue_owner|admin_update_venue_event|admin_create_venue_event|admin_delete_venue_event" src/pages/AdminVenueEdit.tsx
rg -n "venue_owners|profiles" src/pages/AdminVenueEdit.tsx
rg -n "mode=\"admin\"|VenuePhotosCard|OpeningHoursCard|PricingTiersCard|SpeciesStockCard|RulesCard|BookingCard" src/pages/AdminVenueEdit.tsx
rg -n "supabase\\.rpc\\(|supabase\\.storage\\.from\\(|supabase\\.from\\(" src/pages/venue-owner-admin/components/VenuePhotosCard.tsx
rg -n "supabase\\.rpc\\(|\\.from\\(" src/pages/venue-owner-admin/components/OpeningHoursCard.tsx
rg -n "supabase\\.rpc\\(|\\.from\\(" src/pages/venue-owner-admin/components/PricingTiersCard.tsx
rg -n "supabase\\.rpc\\(|\\.from\\(" src/pages/venue-owner-admin/components/SpeciesStockCard.tsx
rg -n "supabase\\.rpc\\(|\\.from\\(" src/pages/venue-owner-admin/components/BookingCard.tsx
rg -n "supabase\\.rpc\\(|\\.from\\(" src/pages/my-venues/components/RulesCard.tsx
rg -n "admin_get_venue_by_slug" supabase/migrations/2132_split_get_venue_by_slug_public_admin.sql
rg -n "admin_get_venue_events|admin_create_venue_event|admin_update_venue_event|admin_delete_venue_event" supabase/migrations/2090_venue_events_rpcs.sql
rg -n "admin_update_venue_metadata" supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql
rg -n "admin_add_venue_owner|admin_remove_venue_owner" supabase/migrations/2073_venue_owners_and_owner_rpcs.sql
rg -n "admin_update_venue_booking|admin_update_venue_rules|admin_create_venue_opening_hour|admin_update_venue_opening_hour|admin_delete_venue_opening_hour" supabase/migrations/2118_venue_owner_phase1_mvp.sql
rg -n "admin_create_venue_pricing_tier|admin_update_venue_pricing_tier|admin_delete_venue_pricing_tier" supabase/migrations -S
rg -n "admin_create_venue_species_stock|admin_update_venue_species_stock|admin_delete_venue_species_stock" supabase/migrations/2123_create_venue_species_stock.sql
rg -n "admin_add_venue_photo" supabase/migrations/2130_harden_venue_photo_path_validation.sql
rg -n "admin_delete_venue_photo" supabase/migrations/2129_admin_venue_photo_rpcs.sql
rg -n "admin_set_venue_photo_primary|get_venue_photos" supabase/migrations/2125_venue_photos_primary.sql
rg -n "venue_rules" supabase/migrations -S | rg -n "policy|row level|trigger"
rg -n "venue_opening_hours" supabase/migrations -S | rg -n "policy|row level|trigger"
rg -n "venue_pricing_tiers" supabase/migrations/2118_venue_owner_phase1_mvp.sql
rg -n "venue_species_stock" supabase/migrations/2123_create_venue_species_stock.sql
rg -n "venue_photos" supabase/migrations -S | rg -n "policy|row level"
rg -n "venue_stats" supabase/migrations -S
```
