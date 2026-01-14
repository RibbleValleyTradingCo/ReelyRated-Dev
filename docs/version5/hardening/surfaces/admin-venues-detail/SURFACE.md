# Surface: admin-venues-detail

## Route patterns

- `/admin/venues/:slug` (`:slug` is a venue slug string, not a UUID)

## Router entry files

- `src/App.tsx`
- `src/pages/AdminVenueEdit.tsx`

## Personas

- Anon: denied (redirect to `/auth`).
- Normal: denied (toast + redirect to `/`).
- Owner: denied (toast + redirect to `/`).
- Private: denied (toast + redirect to `/`).
- Blocked: denied (toast + redirect to `/`).
- Admin: allowed.

## Deny UX

- Anon: `RequireAuth` navigates to `/auth` (no toast). `src/App.tsx:58`.
- Auth non-admin: `checkAdmin` toasts **"You must be an admin to view this page."** and navigates to `/`. `src/pages/AdminVenueEdit.tsx:437`.
- While admin check runs, page shows a spinner with **"Checking admin access..."**. `src/pages/AdminVenueEdit.tsx:986`.
- If `adminStatus` becomes `unauthorized` (e.g., before navigation completes / if navigation is blocked), the component can render an **"Access denied"** card + **"Back to home"** CTA. `src/pages/AdminVenueEdit.tsx:997`.

## Entrypoints

### RPCs

| RPC                              | File                                                              | DB posture                     | Notes                                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| admin_get_venue_by_slug          | `src/pages/AdminVenueEdit.tsx:463`                                | SECURITY DEFINER + admin check | Joins `venues` + `venue_stats` view and returns `notes_for_rr_team`. Refresh path at `src/pages/AdminVenueEdit.tsx:712`. `supabase/migrations/2132_split_get_venue_by_slug_public_admin.sql:93`. |
| admin_get_venue_events           | `src/pages/AdminVenueEdit.tsx:545`                                | SECURITY DEFINER + admin check | Refresh path at `src/pages/AdminVenueEdit.tsx:924`. `supabase/migrations/2090_venue_events_rpcs.sql:290`.                                                                                        |
| admin_update_venue_metadata      | `src/pages/AdminVenueEdit.tsx:699`                                | SECURITY DEFINER + admin check | Updates venues metadata + internal notes. `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:87`.                                                                             |
| admin_add_venue_owner            | `src/pages/AdminVenueEdit.tsx:802`                                | SECURITY DEFINER + admin check | Inserts into `venue_owners`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:44`.                                                                                                      |
| admin_remove_venue_owner         | `src/pages/AdminVenueEdit.tsx:837`                                | SECURITY DEFINER + admin check | Deletes from `venue_owners`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:75`.                                                                                                      |
| admin_create_venue_event         | `src/pages/AdminVenueEdit.tsx:905`                                | SECURITY DEFINER + admin check | Inserts `venue_events`. `supabase/migrations/2090_venue_events_rpcs.sql:168`.                                                                                                                    |
| admin_update_venue_event         | `src/pages/AdminVenueEdit.tsx:885`                                | SECURITY DEFINER + admin check | Updates `venue_events`. `supabase/migrations/2090_venue_events_rpcs.sql:213`.                                                                                                                    |
| admin_delete_venue_event         | `src/pages/AdminVenueEdit.tsx:952`                                | SECURITY DEFINER + admin check | Deletes `venue_events`. `supabase/migrations/2090_venue_events_rpcs.sql:263`.                                                                                                                    |
| admin_update_venue_booking       | `src/pages/venue-owner-admin/components/BookingCard.tsx:40`       | SECURITY DEFINER + admin check | Updates `venues.booking_enabled`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:322`.                                                                                                     |
| admin_update_venue_rules         | `src/pages/my-venues/components/RulesCard.tsx:93`                 | SECURITY DEFINER + admin check | Upserts `venue_rules`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:852`.                                                                                                                |
| admin_create_venue_opening_hour  | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:504` | SECURITY DEFINER + admin check | Writes `venue_opening_hours`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:468`.                                                                                                         |
| admin_update_venue_opening_hour  | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:543` | SECURITY DEFINER + admin check | Writes `venue_opening_hours`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:518`.                                                                                                         |
| admin_delete_venue_opening_hour  | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:475` | SECURITY DEFINER + admin check | Writes `venue_opening_hours`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:562`.                                                                                                         |
| admin_create_venue_pricing_tier  | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:333` | SECURITY DEFINER + admin check | Writes `venue_pricing_tiers`. `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:241`.                                                                                        |
| admin_update_venue_pricing_tier  | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:352` | SECURITY DEFINER + admin check | Writes `venue_pricing_tiers`. `supabase/migrations/2122_add_payment_fields_and_pricing_audience.sql:288`.                                                                                        |
| admin_delete_venue_pricing_tier  | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:318` | SECURITY DEFINER + admin check | Writes `venue_pricing_tiers`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:785`.                                                                                                         |
| admin_create_venue_species_stock | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:333` | SECURITY DEFINER + admin check | Writes `venue_species_stock`. `supabase/migrations/2123_create_venue_species_stock.sql:223`.                                                                                                     |
| admin_update_venue_species_stock | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:352` | SECURITY DEFINER + admin check | Writes `venue_species_stock`. `supabase/migrations/2123_create_venue_species_stock.sql:279`.                                                                                                     |
| admin_delete_venue_species_stock | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:318` | SECURITY DEFINER + admin check | Writes `venue_species_stock`. `supabase/migrations/2123_create_venue_species_stock.sql:327`.                                                                                                     |
| get_venue_photos                 | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70`   | SECURITY INVOKER               | Relies on RLS/grants for `venue_photos`. `supabase/migrations/2125_venue_photos_primary.sql:93`.                                                                                                 |
| admin_add_venue_photo            | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:187`  | SECURITY DEFINER + admin check | Enforces `venue-photos/<venue_id>/` path validation. `supabase/migrations/2130_harden_venue_photo_path_validation.sql:50`.                                                                       |
| admin_delete_venue_photo         | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:240`  | SECURITY DEFINER + admin check | Deletes `venue_photos` row. `supabase/migrations/2129_admin_venue_photo_rpcs.sql:36`.                                                                                                            |
| admin_set_venue_photo_primary    | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:265`  | SECURITY DEFINER + admin check | Updates `venue_photos.is_primary`. `supabase/migrations/2125_venue_photos_primary.sql:55`.                                                                                                       |

### PostgREST

| Table               | Operations | File                                                              | DB posture                                                | Notes                                                                                                                       |
| ------------------- | ---------- | ----------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| admin_users         | select     | `src/lib/admin.ts:14`                                             | RLS: `admin_users_self_select`                            | Admin gate via `isAdminUser`. `supabase/migrations/2016_phase1_admin_visibility.sql:20`.                                    |
| venue_owners        | select     | `src/pages/AdminVenueEdit.tsx:565`                                | RLS: `venue_owners_admin_all`, `venue_owners_self_select` | Owners list + refresh at `src/pages/AdminVenueEdit.tsx:814`. `supabase/migrations/2073_venue_owners_and_owner_rpcs.sql:23`. |
| profiles            | select     | `src/pages/AdminVenueEdit.tsx:784`                                | RLS: `profiles_select_all`                                | Owner lookup by id/username. `supabase/migrations/1004_policies_and_grants.sql:28`.                                         |
| venue_rules         | select     | `src/pages/my-venues/components/RulesCard.tsx:49`                 | RLS: `venue_rules_select`                                 | `supabase/migrations/2118_venue_owner_phase1_mvp.sql:242`.                                                                  |
| venue_opening_hours | select     | `src/pages/venue-owner-admin/components/OpeningHoursCard.tsx:183` | RLS: `venue_opening_hours_select`                         | `supabase/migrations/2118_venue_owner_phase1_mvp.sql:68`.                                                                   |
| venue_pricing_tiers | select     | `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:104` | RLS: `venue_pricing_tiers_select`                         | `supabase/migrations/2118_venue_owner_phase1_mvp.sql:164`.                                                                  |
| venue_species_stock | select     | `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:100` | RLS: `venue_species_stock_select`                         | `supabase/migrations/2123_create_venue_species_stock.sql:51`.                                                               |

PostgREST write posture: **UNKNOWN** until the sweep confirms there are no `.insert/.update/.delete` calls in the shared cards (Rules/OpeningHours/PricingTiers/SpeciesStock) and that all writes are RPC-only.

### Storage

| Bucket       | Operations | File                                                             | Notes                                                                                                                                                                                                                                                                                                                    |
| ------------ | ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| venue-photos | upload     | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:170` | Uploads `venueId/<stamp>.<ext>` with `upsert: false`. During sweep, capture storage.objects policy intent (do not rely on policy name prefixes) and confirm bucket_id='venue-photos' behaviour matches the intended contract.                                                                                            |
| venue-photos | remove     | `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:230` | Delete flow removes storage object before RPC delete; cleanup uses `remove` at `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:198`. During sweep, capture storage.objects policy intent (do not rely on policy name prefixes) and confirm bucket_id='venue-photos' behaviour matches the intended contract. |

### Realtime

None found in route/feature files.

## Implicit DB side-effects

- `admin_update_venue_rules` triggers `trg_venue_rules_set_updated_at`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:226`.
- `admin_create/update/delete_venue_opening_hour` triggers `trg_venue_opening_hours_set_updated_at`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:52`.
- `admin_create/update/delete_venue_pricing_tier` triggers `trg_venue_pricing_tiers_set_updated_at`. `supabase/migrations/2118_venue_owner_phase1_mvp.sql:148`.
- `admin_create/update/delete_venue_species_stock` triggers `trg_venue_species_stock_set_updated_at`. `supabase/migrations/2123_create_venue_species_stock.sql:35`.
- Photo uploads write to `storage.objects` in the `venue-photos` bucket, then insert `venue_photos`. `supabase/migrations/2130_harden_venue_photo_path_validation.sql:88`.

## Security posture notes

- Client-side `RequireAuth`/`checkAdmin` gates are **UX only**; the security boundary is **server-side** admin checks inside RPCs + RLS on any direct PostgREST reads.
- **Shared component coupling:** this surface reuses owner/admin UI from `src/pages/venue-owner-admin/components/*` and `src/pages/my-venues/components/RulesCard.tsx`. Treat `mode="admin"` and client gates as UX only; during the sweep confirm shared components do not perform direct PostgREST writes and all writes go through admin RPCs.
- **SECURITY DEFINER hygiene:** most admin RPCs here are SECURITY DEFINER with `SET search_path = public, extensions`; during the sweep verify objects are schema-qualified and confirm `search_path` is hardened appropriately (ideally empty + fully-qualified objects) to avoid search_path hijack risk.
- **Views + RLS:** `admin_get_venue_by_slug` joins `public.venue_stats` (view). Verify the view posture during the sweep (e.g., whether it runs with invoker rights / `security_invoker` and does not accidentally bypass RLS or expose non-admin-only columns through owner privileges).
- `get_venue_photos` is SECURITY INVOKER and relies on `venue_photos` RLS/grants; confirm anon/auth behaviour matches the intended contract (and that storage/object policies enforce the same access boundary).

## Abuse & validation controls

- Event form requires title + start date/time. `src/pages/AdminVenueEdit.tsx:878`.
- Pricing tiers require label + price. `src/pages/venue-owner-admin/components/PricingTiersCard.tsx:145`.
- Species stock requires species name + record weight/unit. `src/pages/venue-owner-admin/components/SpeciesStockCard.tsx:145`.
- Venue photo uploads enforce file type + size (10MB) client-side. `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:57`.
- `get_venue_photos` uses `p_limit=60` and the function caps to 100. `src/pages/venue-owner-admin/components/VenuePhotosCard.tsx:70`, `supabase/migrations/2125_venue_photos_primary.sql:107`.

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
